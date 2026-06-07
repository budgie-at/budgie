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
            `enter name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length}`,
        (result, input) =>
            `done name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length} id=${result.id}`,
        (error, input) =>
            `throw name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length} error=${getErrorMessage(error)}`
    )
    async createBudget(input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        return transactionAsync(db, async tx => {
            const { categoryLimits, ...budgetFields } = input;
            const createdBudget = await budgetRepository.create(budgetFields, tx);

            await this.createCategoryLimits(createdBudget.id, categoryLimits, tx);

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
            const { categoryLimits, ...budgetFields } = input;
            const updatedBudget = await budgetRepository.update(id, budgetFields, tx);

            await this.syncCategoryLimits(id, categoryLimits, tx);

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
        await Promise.all([
            isNotEmptyArray(diff.toCreate)
                ? budgetCategoryLimitRepository.bulkCreate(
                      diff.toCreate.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount })),
                      tx
                  )
                : null,
            isNotEmptyArray(diff.toUpdate) ? budgetCategoryLimitRepository.bulkUpdate(diff.toUpdate, tx) : null,
            isNotEmptyArray(diff.toDelete) ? budgetCategoryLimitRepository.bulkDelete(diff.toDelete, tx) : null
        ]);
    }
}

export const budgetService = new BudgetService();
