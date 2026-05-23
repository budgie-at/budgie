import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { budgetCategoryLimitRepository, budgetRepository, db } from '../../@generic/drizzle/db/db';

import type { BudgetCategoryLimitInputInterface } from '../interface/budget-category-limit-input.interface';
import type { BudgetCreateInputInterface } from '../interface/budget-create-input.interface';
import type { BudgetUpdateInputInterface } from '../interface/budget-update-input.interface';
import type { CategoryLimitDiffInterface } from '../interface/category-limit-diff.interface';
import type { BudgetCategoryLimitEntityInterface, BudgetEntityInterface, DB } from '@budgie/contracts';

class BudgetService {
    @Log(
        input =>
            `enter name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length}`,
        (result, input) =>
            `done name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length} id=${result.id}`,
        (error, input) =>
            `throw name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length} error=${getErrorMessage(error)}`
    )
    async createBudget(input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        return transactionAsync(db, async tx => {
            const createdBudget = await budgetRepository.create(
                {
                    name: input.name,
                    period: input.period,
                    periodStartDay: input.periodStartDay,
                    useLastDayOfMonth: input.useLastDayOfMonth,
                    overallLimit: input.overallLimit,
                    pushEnabled: input.pushEnabled,
                    instrumentId: input.instrumentId
                },
                tx
            );

            await this.createCategoryLimits(createdBudget.id, input.categoryLimits, tx);

            return createdBudget;
        });
    }

    @Log(
        (id, input) =>
            `enter id=${id} fields=${Object.keys(input).join(',')} categoryLimits=${input.categoryLimits?.length ?? 'unchanged'}`,
        (result, id, input) =>
            `done id=${id} fields=${Object.keys(input).join(',')} categoryLimits=${input.categoryLimits?.length ?? 'unchanged'} updatedId=${result.id}`,
        (error, id, input) =>
            `throw id=${id} fields=${Object.keys(input).join(',')} categoryLimits=${input.categoryLimits?.length ?? 'unchanged'} error=${getErrorMessage(error)}`
    )
    async updateBudget(id: number, input: BudgetUpdateInputInterface): Promise<BudgetEntityInterface> {
        return transactionAsync(db, async tx => {
            const updatedBudget = await budgetRepository.update(
                id,
                {
                    ...(isDefined(input.name) && { name: input.name }),
                    ...(isDefined(input.period) && { period: input.period }),
                    ...(isDefined(input.periodStartDay) && { periodStartDay: input.periodStartDay }),
                    ...(isDefined(input.useLastDayOfMonth) && { useLastDayOfMonth: input.useLastDayOfMonth }),
                    ...(isDefined(input.overallLimit) && { overallLimit: input.overallLimit }),
                    ...(isDefined(input.pushEnabled) && { pushEnabled: input.pushEnabled }),
                    ...(isDefined(input.instrumentId) && { instrumentId: input.instrumentId })
                },
                tx
            );

            await this.syncCategoryLimits(id, input.categoryLimits, tx);

            return updatedBudget;
        });
    }

    @Log(id => `enter id=${id}`, (_result, id) => `done id=${id}`, (error, id) => `throw id=${id} error=${getErrorMessage(error)}`)
    async deleteBudget(id: number): Promise<void> {
        await budgetRepository.delete(id);
    }

    private async createCategoryLimits(
        budgetId: number,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[],
        tx: DB
    ): Promise<void> {
        if (isEmptyArray(categoryLimits)) {
            return;
        }

        await budgetCategoryLimitRepository.bulkCreate(
            categoryLimits.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount })),
            tx
        );
    }

    private async syncCategoryLimits(
        budgetId: number,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[] | undefined,
        tx: DB
    ): Promise<void> {
        if (!isDefined(categoryLimits)) {
            return;
        }

        const existingLimits = await budgetCategoryLimitRepository.getByBudget(budgetId, tx);
        const diff = this.diffCategoryLimits(existingLimits, categoryLimits);

        await this.applyCategoryLimitDiff(budgetId, diff, tx);
    }

    private diffCategoryLimits(
        existingLimits: readonly BudgetCategoryLimitEntityInterface[],
        nextLimits: readonly BudgetCategoryLimitInputInterface[]
    ): CategoryLimitDiffInterface {
        const existingByCategory = new Map(existingLimits.map(limit => [limit.categoryId, limit]));
        const nextCategoryIds = new Set(nextLimits.map(limit => limit.categoryId));

        const toCreate = nextLimits.filter(next => !existingByCategory.has(next.categoryId));
        const toUpdate = nextLimits
            .map(next => {
                const existing = existingByCategory.get(next.categoryId);

                return isDefined(existing) && existing.limitAmount !== next.limitAmount
                    ? { id: existing.id, limitAmount: next.limitAmount }
                    : null;
            })
            .filter(isDefined);
        const toDelete = existingLimits.filter(limit => !nextCategoryIds.has(limit.categoryId)).map(limit => limit.id);

        return { toCreate, toUpdate, toDelete };
    }

    private async applyCategoryLimitDiff(budgetId: number, diff: CategoryLimitDiffInterface, tx: DB): Promise<void> {
        if (isNotEmptyArray(diff.toCreate)) {
            await budgetCategoryLimitRepository.bulkCreate(
                diff.toCreate.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount })),
                tx
            );
        }

        if (isNotEmptyArray(diff.toUpdate)) {
            await budgetCategoryLimitRepository.bulkUpdate(diff.toUpdate, tx);
        }

        if (isNotEmptyArray(diff.toDelete)) {
            await budgetCategoryLimitRepository.bulkDelete(diff.toDelete, tx);
        }
    }
}

export const budgetService = new BudgetService();
