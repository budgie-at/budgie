import { and, between, count, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Db } from '../../@generic/service/db.service';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentTypeEnum } from '../../instrument/enum/instrument-type.enum';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';
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
                rebaseSecurityTradeCosts: (baseInstrumentId: number) =>
                    Db.mutation(
                        { type: 'update', tables: ['transaction_entries'] },
                        Db.query(db =>
                            db.run(sql`
                        UPDATE transaction_entries AS security
                        SET base_instrument_id = ${baseInstrumentId},
                            base_amount = cash.base_amount,
                            base_exchange_rate = cash.base_amount * 1.0 / NULLIF(security.amount, 0)
                        FROM transaction_entries cash
                        INNER JOIN accounts cash_account ON cash_account.id = cash.account_id
                        INNER JOIN instruments cash_instrument ON cash_instrument.id = cash_account.instrument_id
                        INNER JOIN transactions trade ON trade.id = cash.transaction_id
                        WHERE security.transaction_id = cash.transaction_id
                          AND trade.type = ${TransactionTypeEnum.TRANSFER}
                          AND cash_instrument.type = ${InstrumentTypeEnum.FIAT}
                          AND cash.type IN (${TransactionEntryTypeEnum.DEBIT}, ${TransactionEntryTypeEnum.CREDIT})
                          AND security.type IN (${TransactionEntryTypeEnum.DEBIT}, ${TransactionEntryTypeEnum.CREDIT})
                          AND security.type != cash.type
                          AND cash.base_instrument_id = ${baseInstrumentId}
                          AND cash.base_amount IS NOT NULL
                          AND (security.base_instrument_id IS NOT ${baseInstrumentId} OR security.base_amount IS NOT cash.base_amount)
                          AND cash.deleted_at IS NULL AND security.deleted_at IS NULL
                          AND cash.original_transaction_id IS NULL AND security.original_transaction_id IS NULL
                          AND cash_account.deleted_at IS NULL AND trade.deleted_at IS NULL
                          AND security.account_id IN (
                              SELECT account.id FROM accounts account
                              INNER JOIN instruments instrument ON instrument.id = account.instrument_id
                              WHERE instrument.type IN (${InstrumentTypeEnum.EQUITY}, ${InstrumentTypeEnum.ETF})
                                AND account.deleted_at IS NULL
                          )
                    `)
                        )
                    ),

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
