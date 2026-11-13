import { and, asc, between, count, eq, gt, inArray, isNotNull, isNull, not, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentTypeEnum } from '../../instrument/enum/instrument-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { BaseValuationBucketRevaluationInterface } from '../interface/base-valuation-bucket-revaluation.interface';
import type { BaseValuationBucketUpdateInterface } from '../interface/base-valuation-bucket-update.interface';
import type { EntryBaseValuationUpdateInterface } from '../interface/entry-base-valuation-update.interface';
import type { MarketPricedEntryPageInterface } from '../interface/market-priced-entry-page.interface';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import type { SelectedFields } from 'drizzle-orm/sqlite-core';

export class TransactionEntryBaseValuationRepository extends Context.Service<TransactionEntryBaseValuationRepository>()(
    '@budgie/contracts/TransactionEntryBaseValuationRepository',
    {
        make: Effect.sync(() => {
            const originalTransaction = alias(TransactionEntityTable, 'original_transaction');
            const liveEntries = (db: DB) =>
                db
                    .select({
                        id: TransactionEntryEntityTable.id,
                        accountId: TransactionEntryEntityTable.accountId,
                        amount: TransactionEntryEntityTable.amount,
                        baseInstrumentId: TransactionEntryEntityTable.baseInstrumentId,
                        baseExchangeRate: TransactionEntryEntityTable.baseExchangeRate,
                        baseAmount: TransactionEntryEntityTable.baseAmount,
                        transactionSyncId: TransactionEntityTable.syncId,
                        accountType: AccountEntityTable.type,
                        instrumentId: AccountEntityTable.instrumentId,
                        operatedAt: sql`COALESCE(${originalTransaction.operatedAt}, ${TransactionEntityTable.operatedAt})`
                            .mapWith(TransactionEntityTable.operatedAt)
                            .as('operated_at'),
                        rateDate:
                            sql<string>`date(COALESCE(${originalTransaction.operatedAt}, ${TransactionEntityTable.operatedAt}), 'unixepoch')`.as(
                                'rate_date'
                            )
                    })
                    .from(TransactionEntryEntityTable)
                    .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                    .leftJoin(originalTransaction, eq(originalTransaction.id, TransactionEntryEntityTable.originalTransactionId))
                    .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                    .where(
                        and(
                            isNull(TransactionEntryEntityTable.deletedAt),
                            isNull(TransactionEntityTable.deletedAt),
                            isNull(AccountEntityTable.deletedAt)
                        )
                    )
                    .as('live_entries');
            type LiveEntries = ReturnType<typeof liveEntries>;
            const selectLiveEntries = <Fields extends SelectedFields>(
                db: DB,
                buildFields: (live: LiveEntries) => Fields,
                buildCondition: (live: LiveEntries) => SQL | undefined
            ) => {
                const live = liveEntries(db);

                return db.select(buildFields(live)).from(live).where(buildCondition(live));
            };
            const buildMarketPricedPredicate = (accountType: SQLWrapper, instrumentId: SQLWrapper) =>
                sql`(${accountType} IN (${AccountTypeEnum.CRYPTO}, ${AccountTypeEnum.CRYPTO_SYNC}) OR ${instrumentId} IN (SELECT id FROM instruments WHERE type = ${InstrumentTypeEnum.FUND}))`;
            const buildMarketPricedCondition = (live: LiveEntries) => buildMarketPricedPredicate(live.accountType, live.instrumentId);
            const buildPendingCondition = (live: LiveEntries, baseInstrumentId: number) =>
                or(isNull(live.baseInstrumentId), sql`${live.baseInstrumentId} != ${baseInstrumentId}`);
            const findBaseValuationBuckets = (buildCondition: (live: LiveEntries) => SQL | undefined) =>
                Db.query(db =>
                    selectLiveEntries(
                        db,
                        live => ({ rateDate: live.rateDate, sourceInstrumentId: live.instrumentId, entryCount: count(live.id) }),
                        live => and(buildCondition(live), not(buildMarketPricedCondition(live)))
                    ).groupBy(sql`rate_date`, sql`instrument_id`)
                );
            const findMarketPricedEntries = (buildCondition: (live: LiveEntries) => SQL | undefined, afterId: number, limit: number) =>
                Db.query(db =>
                    selectLiveEntries(
                        db,
                        live => ({
                            id: live.id,
                            accountId: live.accountId,
                            amount: live.amount,
                            operatedAt: live.operatedAt,
                            baseInstrumentId: live.baseInstrumentId,
                            baseExchangeRate: live.baseExchangeRate,
                            baseAmount: live.baseAmount
                        }),
                        live => and(buildMarketPricedCondition(live), gt(live.id, afterId), buildCondition(live))
                    )
                        .orderBy(asc(sql`id`))
                        .limit(limit)
                );
            const updateBucketEntries = (rateDate: string, sourceInstrumentId: number, assignment: SQL, condition: SQL) =>
                Db.mutation(
                    { type: 'update', tables: ['transaction_entries'] },
                    Db.query(db =>
                        db.run(sql`
                        UPDATE transaction_entries
                        SET ${assignment}
                        WHERE id IN (
                            SELECT te.id
                            FROM transaction_entries te
                            INNER JOIN transactions t ON t.id = te.transaction_id
                            LEFT JOIN transactions original_t ON original_t.id = te.original_transaction_id
                            INNER JOIN accounts a ON a.id = te.account_id
                            WHERE date(COALESCE(original_t.operated_at, t.operated_at), 'unixepoch') = ${rateDate}
                              AND a.instrument_id = ${sourceInstrumentId}
                              AND te.deleted_at IS NULL
                              AND t.deleted_at IS NULL
                              AND a.deleted_at IS NULL
                              AND NOT ${buildMarketPricedPredicate(sql`a.type`, sql`a.instrument_id`)}
                              AND ${condition}
                        )
                    `)
                    )
                );

            return {
                findPendingBaseValuationBuckets: (baseInstrumentId: number) =>
                    findBaseValuationBuckets(live => buildPendingCondition(live, baseInstrumentId)),
                findBaseValuationBucketsInRange: (baseInstrumentId: number, fromDate: string, toDate: string) =>
                    findBaseValuationBuckets(live =>
                        and(
                            eq(live.baseInstrumentId, baseInstrumentId),
                            isNotNull(live.baseExchangeRate),
                            between(live.rateDate, fromDate, toDate)
                        )
                    ),
                countPendingBaseValuationEntries: (baseInstrumentId: number) =>
                    Db.query(db =>
                        selectLiveEntries(
                            db,
                            live => ({ count: count(live.id) }),
                            live => buildPendingCondition(live, baseInstrumentId)
                        )
                    ).pipe(Effect.map(([row]) => row.count)),
                findPendingMarketPricedEntries: (baseInstrumentId: number, afterId: number, limit: number) =>
                    findMarketPricedEntries(live => buildPendingCondition(live, baseInstrumentId), afterId, limit),
                findMarketPricedEntriesInRange: (page: MarketPricedEntryPageInterface) =>
                    findMarketPricedEntries(
                        live => and(eq(live.instrumentId, page.instrumentId), between(live.rateDate, page.fromDate, page.toDate)),
                        page.afterId,
                        page.limit
                    ),
                findMarketPricedEntryDaysBySyncIds: (transactionSyncIds: readonly string[]) =>
                    Db.query(db =>
                        selectLiveEntries(
                            db,
                            live => ({ instrumentId: live.instrumentId, rateDate: live.rateDate }),
                            live => and(buildMarketPricedCondition(live), inArray(live.transactionSyncId, [...transactionSyncIds]))
                        ).groupBy(sql`instrument_id`, sql`rate_date`)
                    ),
                findMarketPricedInstrumentIds: Db.query(db =>
                    selectLiveEntries(db, live => ({ instrumentId: live.instrumentId }), buildMarketPricedCondition).groupBy(
                        sql`instrument_id`
                    )
                ).pipe(Effect.map(rows => rows.map(row => row.instrumentId))),
                findOldestMarketPricedEntryDate: (instrumentId: number) =>
                    Db.query(db =>
                        selectLiveEntries(
                            db,
                            live => ({ rateDate: sql<string | null>`MIN(${live.rateDate})` }),
                            live => and(buildMarketPricedCondition(live), eq(live.instrumentId, instrumentId))
                        )
                    ).pipe(Effect.map(([row]) => row.rateDate)),
                findMarketPricedAccountIds: (accountIds: readonly number[]) =>
                    Db.query(db =>
                        db
                            .select({ id: AccountEntityTable.id })
                            .from(AccountEntityTable)
                            .where(
                                and(
                                    inArray(AccountEntityTable.id, [...accountIds]),
                                    buildMarketPricedPredicate(AccountEntityTable.type, AccountEntityTable.instrumentId)
                                )
                            )
                    ).pipe(Effect.map(rows => rows.map(row => row.id))),
                updateEntryBaseValuations: (updates: readonly EntryBaseValuationUpdateInterface[]) =>
                    Db.mutation(
                        { type: 'update', tables: ['transaction_entries'] },
                        Effect.forEach(
                            updates,
                            update =>
                                Db.query(db =>
                                    db.run(
                                        sql`UPDATE transaction_entries SET base_instrument_id = ${update.baseInstrumentId}, base_exchange_rate = ${update.baseExchangeRate}, base_amount = ${update.baseAmount} WHERE id = ${update.id}`
                                    )
                                ),
                            { discard: true }
                        )
                    ),
                updateBaseValuationBucket: (input: BaseValuationBucketUpdateInterface) =>
                    updateBucketEntries(
                        input.rateDate,
                        input.sourceInstrumentId,
                        sql`base_instrument_id = ${input.baseInstrumentId}, base_exchange_rate = ${input.baseExchangeRate}, base_amount = ROUND(amount * ${input.baseExchangeRate})`,
                        sql`(te.base_amount IS NULL OR te.base_exchange_rate IS NULL OR te.base_instrument_id IS NULL OR te.base_instrument_id != ${input.baseInstrumentId})`
                    ),
                revalueBaseValuationBucket: (input: BaseValuationBucketRevaluationInterface) =>
                    updateBucketEntries(
                        input.rateDate,
                        input.sourceInstrumentId,
                        sql`base_exchange_rate = ${input.baseExchangeRate}, base_amount = ROUND(amount * ${input.baseExchangeRate})`,
                        sql`te.base_instrument_id = ${input.baseInstrumentId} AND ABS(te.base_exchange_rate - ${input.previousBaseExchangeRate}) <= ${input.previousBaseExchangeRate} * 1e-9`
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionEntryBaseValuationRepository, TransactionEntryBaseValuationRepository.make);
}
