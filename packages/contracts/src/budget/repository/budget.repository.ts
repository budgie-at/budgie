import { Log } from '@budgie/logger';
import { and, between, count, desc, eq, isNull } from 'drizzle-orm';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { BudgetEntityTable } from '../table/budget-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { BudgetCreateEntityInterface } from '../entity/budget-create-entity.interface';
import type { BudgetEntityInterface } from '../entity/budget-entity.interface';
import type { BudgetUpdateEntityInterface } from '../entity/budget-update-entity.interface';

export class BudgetRepository {
    constructor(private db: DB) {}

    @Log(
        (input, tx) =>
            `enter name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} hasTx=${String(isDefined(tx))}`,
        (result, input, tx) =>
            `done name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} hasTx=${String(isDefined(tx))} id=${result.id}`,
        (error, input, tx) =>
            `throw name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async create(input: BudgetCreateEntityInterface, tx?: DB): Promise<BudgetEntityInterface> {
        const [budget] = await (tx ?? this.db).insert(BudgetEntityTable).values([input]).returning();

        return budget;
    }

    @Log(
        (id, input, tx) => `enter id=${id} fields=${Object.keys(input).join(',')} hasTx=${String(isDefined(tx))}`,
        (result, id, input, tx) =>
            `done id=${id} fields=${Object.keys(input).join(',')} hasTx=${String(isDefined(tx))} overallLimit=${result.overallLimit}`,
        (error, id, input, tx) =>
            `throw id=${id} fields=${Object.keys(input).join(',')} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async update(id: number, input: BudgetUpdateEntityInterface, tx?: DB): Promise<BudgetEntityInterface> {
        const [budget] = await (tx ?? this.db).update(BudgetEntityTable).set(input).where(eq(BudgetEntityTable.id, id)).returning();

        return budget;
    }

    @Log(
        tx => `enter hasTx=${String(isDefined(tx))}`,
        (result, tx) => `done hasTx=${String(isDefined(tx))} id=${isDefined(result) ? result.id : 'null'}`,
        (error, tx) => `throw hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async getActive(tx?: DB): Promise<BudgetEntityInterface | null> {
        const budget = await (tx ?? this.db).query.BudgetEntityTable.findFirst({
            where: isNull(BudgetEntityTable.deletedAt),
            orderBy: [desc(BudgetEntityTable.updatedAt)]
        });

        return budget ?? null;
    }

    @Log(
        (id, tx) => `enter id=${id} hasTx=${String(isDefined(tx))}`,
        (_result, id, tx) => `done id=${id} hasTx=${String(isDefined(tx))}`,
        (error, id, tx) => `throw id=${id} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async delete(id: number, tx?: DB): Promise<void> {
        await (tx ?? this.db)
            .update(BudgetEntityTable)
            .set({ deletedAt: new Date() })
            .where(and(eq(BudgetEntityTable.id, id), isNull(BudgetEntityTable.deletedAt)));
    }

    @Log('enter', result => `done missingInstrumentCount=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async countMissingInstrument(): Promise<number> {
        const [row] = await this.db
            .select({ count: count() })
            .from(BudgetEntityTable)
            .where(and(isNull(BudgetEntityTable.instrumentId), isNull(BudgetEntityTable.deletedAt)));

        return row.count;
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
                amount: TransactionEntryEntityTable.amount,
                categoryId: TransactionEntryEntityTable.categoryId,
                instrumentId: AccountEntityTable.instrumentId,
                rate: ExchangeRateEntityTable.rate
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
