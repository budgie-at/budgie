import { and, between, count, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

import type { BaseValuationBucketRevaluationInterface } from '../interface/base-valuation-bucket-revaluation.interface';
import type { BaseValuationBucketUpdateInterface } from '../interface/base-valuation-bucket-update.interface';
import type { SQL } from 'drizzle-orm';

export class TransactionEntryBaseValuationRepository extends Context.Service<TransactionEntryBaseValuationRepository>()(
    '@budgie/contracts/TransactionEntryBaseValuationRepository',
    {
        make: Effect.sync(() => {
            const buildLiveEntryCondition = () =>
                and(
                    isNull(TransactionEntryEntityTable.deletedAt),
                    isNull(TransactionEntityTable.deletedAt),
                    isNull(AccountEntityTable.deletedAt)
                );
            const buildPendingBaseValuationWhere = (baseInstrumentId: number) =>
                and(
                    or(
                        isNull(TransactionEntryEntityTable.baseInstrumentId),
                        sql`${TransactionEntryEntityTable.baseInstrumentId} != ${baseInstrumentId}`
                    ),
                    buildLiveEntryCondition()
                );

            const findBaseValuationBuckets = Effect.fnUntraced(function* (buildWhere: (rateDateSql: SQL<string>) => SQL | undefined) {
                const originalTransaction = alias(TransactionEntityTable, 'original_transaction');
                const rateDateSql = sql<string>`date(COALESCE(${originalTransaction.operatedAt}, ${TransactionEntityTable.operatedAt}), 'unixepoch')`;

                return yield* Db.query(db =>
                    db
                        .select({
                            rateDate: rateDateSql,
                            sourceInstrumentId: AccountEntityTable.instrumentId,
                            entryCount: count(TransactionEntryEntityTable.id)
                        })
                        .from(TransactionEntryEntityTable)
                        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .leftJoin(originalTransaction, eq(originalTransaction.id, TransactionEntryEntityTable.originalTransactionId))
                        .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .where(buildWhere(rateDateSql))
                        .groupBy(rateDateSql, AccountEntityTable.instrumentId)
                );
            });
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
                              AND ${condition}
                        )
                    `)
                    )
                );

            return {
                findPendingBaseValuationBuckets: (baseInstrumentId: number) =>
                    findBaseValuationBuckets(() => buildPendingBaseValuationWhere(baseInstrumentId)),
                findBaseValuationBucketsInRange: (baseInstrumentId: number, fromDate: string, toDate: string) =>
                    findBaseValuationBuckets(rateDateSql =>
                        and(
                            eq(TransactionEntryEntityTable.baseInstrumentId, baseInstrumentId),
                            isNotNull(TransactionEntryEntityTable.baseExchangeRate),
                            buildLiveEntryCondition(),
                            between(rateDateSql, fromDate, toDate)
                        )
                    ),
                countPendingBaseValuationEntries: (baseInstrumentId: number) =>
                    Db.query(db =>
                        db
                            .select({ count: count(TransactionEntryEntityTable.id) })
                            .from(TransactionEntryEntityTable)
                            .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                            .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                            .where(buildPendingBaseValuationWhere(baseInstrumentId))
                    ).pipe(Effect.map(([row]) => row.count)),
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
