import { type SQLWrapper, and, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { alias, unionAll } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionFilters } from '../../@generic/repository/base-transaction-filter.repository';
import { Db } from '../../@generic/service/db.service';
import { AccountTypeEnum } from '../../account/enum/account-type.enum';
import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionConsolidationTypeEnum } from '../enum/transaction-consolidation-type.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

import type { TransactionDayNetAmountRowInterface } from '../interface/transaction-day-net-amount-row.interface';

export class TransactionDayNetAmountRepository extends Context.Service<TransactionDayNetAmountRepository>()(
    '@budgie/contracts/TransactionDayNetAmountRepository',
    {
        make: Effect.sync(() => {
            const buildEntryAccountConditions = (accountIds: number[] | null) =>
                isNotEmptyArray(accountIds) ? [inArray(TransactionEntryEntityTable.accountId, accountIds)] : [];

            const buildDayNetAmountFields = (operatedAt: SQLWrapper, defaultInstrumentId: number) => {
                const signSql = sql`CASE ${TransactionEntryEntityTable.type} WHEN ${TransactionEntryTypeEnum.DEBIT} THEN 1 ELSE -1 END`;

                return {
                    day: sql<string>`date(${operatedAt}, 'unixepoch', 'localtime')`.as('day'),
                    instrumentId: AccountEntityTable.instrumentId,
                    instrumentSymbol: InstrumentEntityTable.symbol,
                    amount: sql<number>`SUM(${signSql} * ${TransactionEntryEntityTable.amount})`.mapWith(Number).as('amount'),
                    baseAmount: sql<number>`COALESCE(SUM(${signSql} * ${TransactionEntryEntityTable.baseAmount}), 0)`
                        .mapWith(Number)
                        .as('base_amount'),
                    unvaluedCount:
                        sql<number>`SUM(CASE WHEN ${TransactionEntryEntityTable.baseAmount} IS NULL OR ${TransactionEntryEntityTable.baseInstrumentId} IS NOT ${defaultInstrumentId} THEN 1 ELSE 0 END)`
                            .mapWith(Number)
                            .as('unvalued_count')
                };
            };

            return {
                getDayNetAmounts: Effect.fn('TransactionDayNetAmountRepository.getDayNetAmounts')(function* (
                    accountIds: number[] | null,
                    from: Date,
                    to: Date,
                    defaultInstrumentId: number
                ) {
                    const debtAccounts = isNotEmptyArray(accountIds)
                        ? yield* Db.query(db =>
                              db
                                  .select({ id: AccountEntityTable.id })
                                  .from(AccountEntityTable)
                                  .where(and(inArray(AccountEntityTable.id, accountIds), eq(AccountEntityTable.type, AccountTypeEnum.DEBT)))
                                  .limit(1)
                          )
                        : [];

                    if (isNotEmptyArray(debtAccounts)) {
                        return [];
                    }

                    const originalTransaction = alias(TransactionEntityTable, 'original_transaction');
                    const rows = yield* Db.query(db =>
                        unionAll(
                            db
                                .select(buildDayNetAmountFields(TransactionEntityTable.operatedAt, defaultInstrumentId))
                                .from(TransactionEntryEntityTable)
                                .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                                .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                                .innerJoin(TransactionEntityTable, eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId))
                                .where(
                                    and(
                                        transactionFilters.buildLedgerEntryCondition(),
                                        transactionFilters.buildVisibleTransactionCondition(),
                                        gte(TransactionEntityTable.operatedAt, from),
                                        lte(TransactionEntityTable.operatedAt, to),
                                        ...buildEntryAccountConditions(accountIds)
                                    )
                                )
                                .groupBy(sql`day`, AccountEntityTable.instrumentId),
                            db
                                .select(buildDayNetAmountFields(originalTransaction.operatedAt, defaultInstrumentId))
                                .from(originalTransaction)
                                .crossJoin(TransactionEntryEntityTable)
                                .crossJoin(TransactionEntityTable)
                                .innerJoin(AccountEntityTable, eq(AccountEntityTable.id, TransactionEntryEntityTable.accountId))
                                .innerJoin(InstrumentEntityTable, eq(InstrumentEntityTable.id, AccountEntityTable.instrumentId))
                                .where(
                                    and(
                                        isNull(originalTransaction.deletedAt),
                                        gte(originalTransaction.operatedAt, from),
                                        lte(originalTransaction.operatedAt, to),
                                        eq(TransactionEntryEntityTable.originalTransactionId, originalTransaction.id),
                                        isNull(TransactionEntryEntityTable.deletedAt),
                                        eq(TransactionEntityTable.id, TransactionEntryEntityTable.transactionId),
                                        transactionFilters.buildVisibleTransactionCondition(),
                                        eq(TransactionEntityTable.consolidationType, TransactionConsolidationTypeEnum.REFUND),
                                        ...buildEntryAccountConditions(accountIds)
                                    )
                                )
                                .groupBy(sql`day`, AccountEntityTable.instrumentId)
                        )
                    );

                    const instrumentIdsByDay = new Map<string, Set<number>>();
                    const days = new Map<string, TransactionDayNetAmountRowInterface>();

                    for (const row of rows) {
                        const day = days.get(row.day);
                        const instrumentIds = instrumentIdsByDay.get(row.day) ?? new Set<number>();

                        instrumentIdsByDay.set(row.day, instrumentIds.add(row.instrumentId));
                        days.set(row.day, {
                            day: row.day,
                            amount: (day?.amount ?? 0) + row.amount,
                            baseAmount: (day?.baseAmount ?? 0) + row.baseAmount,
                            instrumentSymbol: day?.instrumentSymbol ?? row.instrumentSymbol,
                            instrumentCount: instrumentIds.size,
                            unvaluedCount: (day?.unvaluedCount ?? 0) + row.unvaluedCount
                        });
                    }

                    return [...days.values()];
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionDayNetAmountRepository, TransactionDayNetAmountRepository.make);
}
