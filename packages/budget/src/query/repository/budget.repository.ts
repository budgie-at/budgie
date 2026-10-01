import {
    AccountEntityTable,
    BaseTransactionFilterRepository,
    BudgetEntityTable,
    Db,
    ExchangeRateEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    buildSpendingEntryCondition
} from '@budgie/contracts';
import { and, between, eq, isNull, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { BudgetCreateEntityInterface, BudgetUpdateEntityInterface } from '@budgie/contracts';

export class BudgetRepository extends Context.Service<BudgetRepository>()('@budgie/budget/BudgetRepository', {
    make: Effect.sync(() => {
        const filters = new BaseTransactionFilterRepository();

        const buildRefundAdjustedAmountSql = () =>
            sql<number>`CASE
        WHEN ${TransactionEntityTable.consolidationType} = ${TransactionConsolidationTypeEnum.REFUND}
        THEN ${TransactionEntryEntityTable.amount} - (
            COALESCE((
                SELECT SUM(refund_entry.amount)
                FROM transaction_entries refund_entry
                WHERE refund_entry.transaction_id = ${TransactionEntryEntityTable.transactionId}
                  AND refund_entry.original_transaction_id IS NOT NULL
                  AND refund_entry.deleted_at IS NULL
                  AND refund_entry.type = ${TransactionEntryTypeEnum.DEBIT}
            ), 0)
            * ${TransactionEntryEntityTable.amount}
            / NULLIF(COALESCE((
                SELECT SUM(ledger_credit.amount)
                FROM transaction_entries ledger_credit
                WHERE ledger_credit.transaction_id = ${TransactionEntryEntityTable.transactionId}
                  AND ledger_credit.original_transaction_id IS NULL
                  AND ledger_credit.deleted_at IS NULL
                  AND ledger_credit.type = ${TransactionEntryTypeEnum.CREDIT}
            ), 0), 0)
        )
        ELSE ${TransactionEntryEntityTable.amount}
    END`;

        const buildSpentWhere = (periodStart: Date, nextPeriodStart: Date) =>
            and(
                filters.buildVisibleTransactionCondition(),
                filters.buildPrimaryLedgerEntryCondition(),
                filters.buildNonDebtAccountCondition(),
                filters.buildExpenseAnalyticsEntryCondition(),
                buildSpendingEntryCondition(),
                between(TransactionEntityTable.operatedAt, periodStart, new Date(nextPeriodStart.getTime() - 1))
            );

        return {
            create: (input: BudgetCreateEntityInterface) =>
                Db.query(db => db.insert(BudgetEntityTable).values([input]).returning()).pipe(Effect.map(([budget]) => budget)),
            update: (id: number, input: BudgetUpdateEntityInterface) =>
                Db.query(db => db.update(BudgetEntityTable).set(input).where(eq(BudgetEntityTable.id, id)).returning()).pipe(
                    Effect.map(([budget]) => budget)
                ),
            delete: (id: number) =>
                Db.query(db =>
                    db
                        .update(BudgetEntityTable)
                        .set({ deletedAt: new Date() })
                        .where(and(eq(BudgetEntityTable.id, id), isNull(BudgetEntityTable.deletedAt)))
                ),
            findActive: () =>
                Db.query(db =>
                    db.query.BudgetEntityTable.findFirst({
                        where: { deletedAt: { isNull: true } },
                        orderBy: { updatedAt: 'desc' }
                    })
                ),
            findBudgetSpentEntries: (periodStart: Date, nextPeriodStart: Date, baseInstrumentId: number) =>
                Db.query(db =>
                    db
                        .select({
                            amount: buildRefundAdjustedAmountSql(),
                            categoryId: TransactionEntryEntityTable.categoryId,
                            instrumentId: AccountEntityTable.instrumentId,
                            rate: ExchangeRateEntityTable.rate,
                            operatedAt: TransactionEntityTable.operatedAt
                        })
                        .from(TransactionEntryEntityTable)
                        .innerJoin(TransactionEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(AccountEntityTable, eq(TransactionEntryEntityTable.accountId, AccountEntityTable.id))
                        .leftJoin(
                            ExchangeRateEntityTable,
                            and(
                                eq(ExchangeRateEntityTable.baseInstrumentId, AccountEntityTable.instrumentId),
                                eq(ExchangeRateEntityTable.quoteInstrumentId, baseInstrumentId),
                                isNull(ExchangeRateEntityTable.deletedAt)
                            )
                        )
                        .where(buildSpentWhere(periodStart, nextPeriodStart))
                )
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetRepository, BudgetRepository.make);
}
