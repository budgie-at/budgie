import { Log } from '@budgie/logger';
import { and, eq, isNull } from 'drizzle-orm';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { BudgetAlertEntityTable } from '../table/budget-alert-entity.table';

import type { DB } from '../../@generic/type/db.type';
import type { BudgetAlertCreateEntityInterface } from '../entity/budget-alert-create-entity.interface';
import type { BudgetAlertEntityInterface } from '../entity/budget-alert-entity.interface';

export class BudgetAlertRepository {
    constructor(private db: DB) {}

    @Log(
        input =>
            `enter budgetId=${input.budgetId} periodStart=${input.periodStart.toISOString()} scope=${input.scope} threshold=${input.threshold} categoryId=${String(input.categoryId)}`,
        (result, input) =>
            `done budgetId=${input.budgetId} periodStart=${input.periodStart.toISOString()} scope=${input.scope} threshold=${input.threshold} categoryId=${String(input.categoryId)} id=${isDefined(result) ? String(result.id) : 'null'}`,
        (error, input) =>
            `throw budgetId=${input.budgetId} periodStart=${input.periodStart.toISOString()} scope=${input.scope} threshold=${input.threshold} categoryId=${String(input.categoryId)} error=${getErrorMessage(error)}`
    )
    async createIfMissing(input: BudgetAlertCreateEntityInterface): Promise<BudgetAlertEntityInterface | null> {
        const rows = await this.db.insert(BudgetAlertEntityTable).values([input]).onConflictDoNothing().returning();

        return rows[0] ?? null;
    }

    @Log(id => `enter id=${id}`, (_result, id) => `done id=${id}`, (error, id) => `throw id=${id} error=${getErrorMessage(error)}`)
    async dismiss(id: number): Promise<void> {
        await this.db
            .update(BudgetAlertEntityTable)
            .set({ dismissedAt: new Date() })
            .where(
                and(eq(BudgetAlertEntityTable.id, id), isNull(BudgetAlertEntityTable.dismissedAt), isNull(BudgetAlertEntityTable.deletedAt))
            );
    }

    @Log(
        (budgetId, periodStart) => `enter budgetId=${budgetId} periodStart=${periodStart.toISOString()}`,
        (result, budgetId, periodStart) =>
            `done budgetId=${budgetId} periodStart=${periodStart.toISOString()} ids=${result.map(row => row.id).join(',')}`,
        (error, budgetId, periodStart) =>
            `throw budgetId=${budgetId} periodStart=${periodStart.toISOString()} error=${getErrorMessage(error)}`
    )
    async findActive(budgetId: number, periodStart: Date): Promise<BudgetAlertEntityInterface[]> {
        return await this.findActiveLive(budgetId, periodStart);
    }

    findActiveLive(budgetId: number, periodStart: Date) {
        return this.db.query.BudgetAlertEntityTable.findMany({
            where: and(
                eq(BudgetAlertEntityTable.budgetId, budgetId),
                eq(BudgetAlertEntityTable.periodStart, periodStart),
                isNull(BudgetAlertEntityTable.dismissedAt),
                isNull(BudgetAlertEntityTable.deletedAt)
            )
        });
    }
}
