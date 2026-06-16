import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetCreateInputInterface } from '../interface/budget-create-input.interface';
import type { BudgetUpdateInputInterface } from '../interface/budget-update-input.interface';
import type {
    BudgetCategoryLimitBulkUpdateInputInterface,
    BudgetCategoryLimitCreateEntityInterface,
    BudgetCategoryLimitEntityInterface,
    BudgetCreateEntityInterface,
    BudgetEntityInterface,
    BudgetUpdateEntityInterface
} from '@budgie/contracts';

export class BudgetService<Database, Transaction> {
    constructor(
        private readonly database: Database,
        private readonly budgetRepository: {
            readonly create: (input: BudgetCreateEntityInterface, tx?: Transaction) => Promise<BudgetEntityInterface>;
            readonly update: (id: number, input: BudgetUpdateEntityInterface, tx?: Transaction) => Promise<BudgetEntityInterface>;
            readonly delete: (id: number, tx?: Transaction) => Promise<void>;
        },
        private readonly budgetCategoryLimitRepository: {
            readonly bulkCreate: (
                inputs: BudgetCategoryLimitCreateEntityInterface[],
                tx?: Transaction
            ) => Promise<BudgetCategoryLimitEntityInterface[]>;
            readonly bulkUpdate: (
                updates: BudgetCategoryLimitBulkUpdateInputInterface[],
                tx?: Transaction
            ) => Promise<BudgetCategoryLimitEntityInterface[]>;
            readonly bulkDelete: (ids: number[], tx?: Transaction) => Promise<void>;
            readonly getByBudget: (budgetId: number, tx?: Transaction) => Promise<BudgetCategoryLimitEntityInterface[]>;
        },
        private readonly runTransaction: <Result>(
            database: Database,
            callback: (transaction: Transaction) => Promise<Result>
        ) => Promise<Result>
    ) {}

    @Log(
        input =>
            `enter name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length}`,
        (result, input) =>
            `done name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length} id=${result.id}`,
        (error, input) =>
            `throw name="${input.name}" period=${input.period} overallLimit=${input.overallLimit} otherLimit=${input.otherLimit} periodStartDay=${input.periodStartDay} useLastDayOfMonth=${String(input.useLastDayOfMonth)} categoryLimits=${input.categoryLimits.length} error=${getErrorMessage(error)}`
    )
    async createBudget(input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        return this.runTransaction(this.database, async tx => {
            const { categoryLimits, ...budgetFields } = input;
            const createdBudget = await this.budgetRepository.create(budgetFields, tx);

            await this.createCategoryLimits(createdBudget.id, categoryLimits, tx);

            return createdBudget;
        });
    }

    @Log(
        (id, input) =>
            `enter id=${id} fields=${Object.keys(input).join(',')} categoryLimits=${isDefined(input.categoryLimits) ? input.categoryLimits.length : 'unchanged'}`,
        (result, id, input) =>
            `done id=${id} fields=${Object.keys(input).join(',')} categoryLimits=${isDefined(input.categoryLimits) ? input.categoryLimits.length : 'unchanged'} updatedId=${result.id}`,
        (error, id, input) =>
            `throw id=${id} fields=${Object.keys(input).join(',')} categoryLimits=${isDefined(input.categoryLimits) ? input.categoryLimits.length : 'unchanged'} error=${getErrorMessage(error)}`
    )
    async updateBudget(id: number, input: BudgetUpdateInputInterface): Promise<BudgetEntityInterface> {
        return this.runTransaction(this.database, async tx => {
            const { categoryLimits, ...budgetFields } = input;
            const updatedBudget = await this.budgetRepository.update(id, budgetFields, tx);

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
        await this.budgetRepository.delete(id);
    }

    private async createCategoryLimits(
        budgetId: number,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[],
        tx: Transaction
    ): Promise<void> {
        if (isEmptyArray(categoryLimits)) {
            return;
        }

        await this.budgetCategoryLimitRepository.bulkCreate(
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

        const existingLimits = await this.budgetCategoryLimitRepository.getByBudget(budgetId, tx);
        const existingByCategory = new Map(existingLimits.map(limit => [limit.categoryId, limit]));
        const nextCategoryIds = new Set(categoryLimits.map(limit => limit.categoryId));
        const toCreate = categoryLimits.filter(next => !existingByCategory.has(next.categoryId));
        const toUpdate = this.buildCategoryLimitUpdates(categoryLimits, existingByCategory);
        const toDelete = existingLimits.filter(limit => !nextCategoryIds.has(limit.categoryId)).map(limit => limit.id);

        await Promise.all([
            isNotEmptyArray(toCreate)
                ? this.budgetCategoryLimitRepository.bulkCreate(
                      toCreate.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount })),
                      tx
                  )
                : null,
            isNotEmptyArray(toUpdate) ? this.budgetCategoryLimitRepository.bulkUpdate([...toUpdate], tx) : null,
            isNotEmptyArray(toDelete) ? this.budgetCategoryLimitRepository.bulkDelete([...toDelete], tx) : null
        ]);
    }

    private buildCategoryLimitUpdates(
        categoryLimits: readonly BudgetCategoryLimitInputInterface[],
        existingByCategory: ReadonlyMap<number, BudgetCategoryLimitEntityInterface>
    ): BudgetCategoryLimitBulkUpdateInputInterface[] {
        return categoryLimits
            .map(next => {
                const existing = existingByCategory.get(next.categoryId);

                return isDefined(existing) && existing.limitAmount !== next.limitAmount
                    ? { id: existing.id, limitAmount: next.limitAmount }
                    : null;
            })
            .filter(isDefined);
    }
}
