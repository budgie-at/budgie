import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { budgetCategoryLimitDiffService } from '../../category-limit/service/budget-category-limit-diff.service';

import type { BudgetCategoryLimitDiffInterface } from '../../category-limit/interface/budget-category-limit-diff.interface';
import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetCreateInputInterface } from '../interface/budget-create-input.interface';
import type { BudgetServiceDependenciesInterface } from '../interface/budget-service-dependencies.interface';
import type { BudgetUpdateInputInterface } from '../interface/budget-update-input.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';

export class BudgetService<Transaction> {
    constructor(private readonly dependencies: BudgetServiceDependenciesInterface<Transaction>) {}

    @Log(
        input =>
            `enter name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length}`,
        (result, input) =>
            `done name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length} id=${result.id}`,
        (error, input) =>
            `throw name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length} error=${getErrorMessage(error)}`
    )
    async createBudget(input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        return this.dependencies.runTransaction(this.dependencies.database, async tx => {
            const { categoryLimits, ...budgetFields } = input;
            const createdBudget = await this.dependencies.budgetRepository.create(budgetFields, tx);

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
        return this.dependencies.runTransaction(this.dependencies.database, async tx => {
            const { categoryLimits, ...budgetFields } = input;
            const updatedBudget = await this.dependencies.budgetRepository.update(id, budgetFields, tx);

            await this.syncCategoryLimits(id, categoryLimits, tx);

            return updatedBudget;
        });
    }

    @Log(
        id => `enter id=${id}`,
        (result, id) => `done id=${id} result=${String(result)}`,
        (error, id) => `throw id=${id} error=${getErrorMessage(error)}`
    )
    async deleteBudget(id: number): Promise<void> {
        await this.dependencies.budgetRepository.delete(id);
    }

    private async createCategoryLimits(
        budgetId: number,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[],
        tx: Transaction
    ): Promise<void> {
        if (isEmptyArray(categoryLimits)) {
            return;
        }

        await this.dependencies.budgetCategoryLimitRepository.bulkCreate(
            categoryLimits.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount })),
            tx
        );
    }

    private async syncCategoryLimits(
        budgetId: number,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[] | undefined,
        tx: Transaction
    ): Promise<void> {
        if (!isDefined(categoryLimits)) {
            return;
        }

        const existingLimits = await this.dependencies.budgetCategoryLimitRepository.getByBudget(budgetId, tx);
        const diff = budgetCategoryLimitDiffService.diffCategoryLimits(existingLimits, categoryLimits);

        await this.applyCategoryLimitDiff(budgetId, diff, tx);
    }

    private async applyCategoryLimitDiff(budgetId: number, diff: BudgetCategoryLimitDiffInterface, tx: Transaction): Promise<void> {
        await Promise.all([
            isNotEmptyArray(diff.toCreate)
                ? this.dependencies.budgetCategoryLimitRepository.bulkCreate(
                      diff.toCreate.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount })),
                      tx
                  )
                : null,
            isNotEmptyArray(diff.toUpdate) ? this.dependencies.budgetCategoryLimitRepository.bulkUpdate(diff.toUpdate, tx) : null,
            isNotEmptyArray(diff.toDelete) ? this.dependencies.budgetCategoryLimitRepository.bulkDelete(diff.toDelete, tx) : null
        ]);
    }
}
