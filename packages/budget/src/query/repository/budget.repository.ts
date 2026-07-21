import {
    AccountEntityTable,
    BudgetEntityTable,
    ExchangeRateEntityTable,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { and, between, desc, eq, isNull, sql } from 'drizzle-orm';

import type { BudgetCreateEntityInterface, BudgetEntityInterface, BudgetUpdateEntityInterface, DB } from '@budgie/contracts';

export class BudgetRepository {
    constructor(private db: DB) {}

    async create(input: BudgetCreateEntityInterface, tx?: DB): Promise<BudgetEntityInterface> {
        const [budget] = await (tx ?? this.db).insert(BudgetEntityTable).values([input]).returning();

        return budget;
    }

    async update(id: number, input: BudgetUpdateEntityInterface, tx?: DB): Promise<BudgetEntityInterface> {
        const [budget] = await (tx ?? this.db).update(BudgetEntityTable).set(input).where(eq(BudgetEntityTable.id, id)).returning();

        return budget;
    }

    async getActive(tx?: DB): Promise<BudgetEntityInterface | null> {
        const budget = await (tx ?? this.db).query.BudgetEntityTable.findFirst({
            where: isNull(BudgetEntityTable.deletedAt),
            orderBy: [desc(BudgetEntityTable.updatedAt)]
        });

        return budget ?? null;
    }

    async delete(id: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(BudgetEntityTable)
            .set({ deletedAt: new Date() })
            .where(and(eq(BudgetEntityTable.id, id), isNull(BudgetEntityTable.deletedAt)));
    }

    findActive() {
        return this.db.query.BudgetEntityTable.findFirst({
            where: isNull(BudgetEntityTable.deletedAt),
            orderBy: [desc(BudgetEntityTable.updatedAt)]
        });
    }

    findBudgetSpentEntries(periodStart: Date, nextPeriodStart: Date, baseInstrumentId: number) {
        return this.db
            .select({
                amount: this.buildRefundAdjustedAmountSql(),
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
            .where(this.buildSpentWhere(periodStart, nextPeriodStart));
    }

    private buildRefundAdjustedAmountSql() {
        return sql<number>`CASE
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
    }

    private buildSpentWhere(periodStart: Date, nextPeriodStart: Date) {
        return and(
            eq(TransactionEntityTable.type, TransactionTypeEnum.EXPENSE),
            eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.CREDIT),
            isNull(TransactionEntityTable.deletedAt),
            isNull(TransactionEntryEntityTable.deletedAt),
            between(TransactionEntityTable.operatedAt, periodStart, new Date(nextPeriodStart.getTime() - 1))
        );
    }
}
