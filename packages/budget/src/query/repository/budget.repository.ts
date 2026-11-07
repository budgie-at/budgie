import {
    AccountDebtTypeEnum,
    AccountEntityTable,
    DebtEventDirectionEnum,
    DebtEventEntityTable,
    transactionFilters,
    BudgetEntityTable,
    BudgetKindEnum,
    Db,
    ExchangeRateEntityTable,
    HOUSEHOLD_SYNC_ZONE,
    PERSONAL_SYNC_ZONE,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTagsEntityTable,
    TransactionTypeEnum,
    buildAccountSharedByOtherSql,
    buildSpendingEntryCondition
} from '@budgie/contracts';
import { startOfDay } from 'date-fns/startOfDay';
import { and, asc, between, eq, gte, isNull, min, ne, or, sql } from 'drizzle-orm';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { BudgetEntityInterface, BudgetCreateEntityInterface, BudgetUpdateEntityInterface } from '@budgie/contracts';
import type { SQL } from 'drizzle-orm';

export class BudgetRepository extends Context.Service<BudgetRepository>()('@budgie/budget/BudgetRepository', {
    make: Effect.sync(() => {
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
                transactionFilters.buildVisibleTransactionCondition(),
                transactionFilters.buildPrimaryLedgerEntryCondition(),
                transactionFilters.buildNonDebtAccountCondition(),
                transactionFilters.buildExpenseAnalyticsEntryCondition(),
                buildSpendingEntryCondition(),
                between(TransactionEntityTable.operatedAt, periodStart, new Date(nextPeriodStart.getTime() - 1))
            );

        const buildIncomeWhere = (periodStart: Date, nextPeriodStart: Date) =>
            and(
                transactionFilters.buildVisibleTransactionCondition(),
                transactionFilters.buildPrimaryLedgerEntryCondition(),
                transactionFilters.buildNonDebtAccountCondition(),
                buildSpendingEntryCondition(),
                eq(TransactionEntityTable.type, TransactionTypeEnum.INCOME),
                eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT),
                or(
                    isNull(TransactionEntityTable.consolidationType),
                    ne(TransactionEntityTable.consolidationType, TransactionConsolidationTypeEnum.REFUND)
                ),
                between(TransactionEntityTable.operatedAt, periodStart, new Date(nextPeriodStart.getTime() - 1))
            );

        const buildEventWhere = (periodStart: Date, nextPeriodStart: Date, tagId: number) =>
            and(
                buildSpentWhere(periodStart, nextPeriodStart),
                sql`${TransactionEntityTable.id} IN (SELECT ${TransactionTagsEntityTable.transactionId} FROM ${TransactionTagsEntityTable} WHERE ${TransactionTagsEntityTable.tagId} = ${tagId})`
            );

        const buildBudgetScopeConditions = (budgetSyncZone: string) =>
            budgetSyncZone === HOUSEHOLD_SYNC_ZONE
                ? [eq(AccountEntityTable.syncZone, HOUSEHOLD_SYNC_ZONE)]
                : [sql`NOT ${buildAccountSharedByOtherSql()}`];

        const findEntries = (
            amountSql: SQL<number>,
            where: SQL | undefined,
            baseInstrumentId: number,
            budgetSyncZone = PERSONAL_SYNC_ZONE
        ) =>
            Db.query(db =>
                db
                    .select({
                        amount: amountSql,
                        categoryId: TransactionEntryEntityTable.categoryId,
                        instrumentId: AccountEntityTable.instrumentId,
                        rate: ExchangeRateEntityTable.rate,
                        operatedAt: TransactionEntityTable.operatedAt,
                        transactionId: TransactionEntityTable.id,
                        entryId: TransactionEntryEntityTable.id
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
                    .where(and(where, ...buildBudgetScopeConditions(budgetSyncZone)))
            );

        return {
            create: (input: BudgetCreateEntityInterface) =>
                Db.query(db => db.insert(BudgetEntityTable).values([input]).returning()).pipe(Effect.map(([budget]) => budget)),
            update: (id: number, input: BudgetUpdateEntityInterface) =>
                Db.query(db => db.update(BudgetEntityTable).set(input).where(eq(BudgetEntityTable.id, id)).returning()).pipe(
                    Effect.map(([budget]) => budget)
                ),
            findById: (id: number) => Db.query(db => db.query.BudgetEntityTable.findFirst({ where: { id, deletedAt: { isNull: true } } })),
            delete: (id: number) =>
                Db.query(db =>
                    db
                        .update(BudgetEntityTable)
                        .set({ deletedAt: new Date() })
                        .where(and(eq(BudgetEntityTable.id, id), isNull(BudgetEntityTable.deletedAt)))
                ),
            findMain: Db.query(db =>
                db.query.BudgetEntityTable.findFirst({
                    where: { deletedAt: { isNull: true }, kind: BudgetKindEnum.MAIN },
                    orderBy: { updatedAt: 'desc' }
                })
            ),
            findAllMain: Db.query(db =>
                db.query.BudgetEntityTable.findMany({
                    where: { deletedAt: { isNull: true }, kind: BudgetKindEnum.MAIN },
                    orderBy: { updatedAt: 'desc' }
                })
            ),
            findActiveEvents: (now: Date) =>
                Db.query(db =>
                    db
                        .select()
                        .from(BudgetEntityTable)
                        .where(
                            and(
                                isNull(BudgetEntityTable.deletedAt),
                                eq(BudgetEntityTable.kind, BudgetKindEnum.EVENT),
                                gte(BudgetEntityTable.endsAt, startOfDay(now))
                            )
                        )
                        .orderBy(asc(BudgetEntityTable.startsAt))
                ),
            findEvent: (id: number) =>
                Db.query(db =>
                    db.query.BudgetEntityTable.findFirst({
                        where: { id, deletedAt: { isNull: true }, kind: BudgetKindEnum.EVENT }
                    })
                ),
            findEarliestOperatedAt: Db.query(db =>
                db
                    .select({ earliest: min(TransactionEntityTable.operatedAt) })
                    .from(TransactionEntityTable)
                    .where(isNull(TransactionEntityTable.deletedAt))
            ).pipe(Effect.map(([row]) => row.earliest ?? null)),
            findBudgetSpentEntries: (
                periodStart: Date,
                nextPeriodStart: Date,
                baseInstrumentId: number,
                budgetSyncZone = PERSONAL_SYNC_ZONE
            ) =>
                findEntries(
                    buildRefundAdjustedAmountSql(),
                    buildSpentWhere(periodStart, nextPeriodStart),
                    baseInstrumentId,
                    budgetSyncZone
                ),
            findIncomeReceivedEntries: (
                periodStart: Date,
                nextPeriodStart: Date,
                baseInstrumentId: number,
                budgetSyncZone = PERSONAL_SYNC_ZONE
            ) =>
                findEntries(
                    sql<number>`${TransactionEntryEntityTable.amount}`,
                    buildIncomeWhere(periodStart, nextPeriodStart),
                    baseInstrumentId,
                    budgetSyncZone
                ),
            findEventSpentEntries: (
                periodStart: Date,
                nextPeriodStart: Date,
                budget: Pick<BudgetEntityInterface, 'instrumentId' | 'tagId' | 'syncZone'>
            ) =>
                isDefined(budget.tagId)
                    ? findEntries(
                          buildRefundAdjustedAmountSql(),
                          buildEventWhere(periodStart, nextPeriodStart, budget.tagId),
                          budget.instrumentId,
                          budget.syncZone
                      )
                    : Effect.succeed([]),
            findInstallmentPayments: (periodStart: Date, nextPeriodStart: Date, budgetSyncZone = PERSONAL_SYNC_ZONE) =>
                Db.query(db =>
                    db
                        .select({ transactionId: TransactionEntityTable.id, installmentAccountId: DebtEventEntityTable.debtAccountId })
                        .from(DebtEventEntityTable)
                        .innerJoin(TransactionEntityTable, eq(DebtEventEntityTable.transactionId, TransactionEntityTable.id))
                        .innerJoin(AccountEntityTable, eq(DebtEventEntityTable.debtAccountId, AccountEntityTable.id))
                        .where(
                            and(
                                eq(DebtEventEntityTable.direction, DebtEventDirectionEnum.CLOSE),
                                eq(AccountEntityTable.debtType, AccountDebtTypeEnum.INSTALLMENT),
                                isNull(DebtEventEntityTable.deletedAt),
                                between(TransactionEntityTable.operatedAt, periodStart, new Date(nextPeriodStart.getTime() - 1)),
                                ...buildBudgetScopeConditions(budgetSyncZone)
                            )
                        )
                )
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetRepository, BudgetRepository.make);
}
