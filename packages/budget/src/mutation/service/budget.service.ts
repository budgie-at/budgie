import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import type { BudgetCategoryLimitRepository } from '../../query/repository/budget-category-limit.repository';
import type { BudgetRepository } from '../../query/repository/budget.repository';
import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetCreateInputInterface } from '../interface/budget-create-input.interface';
import type { BudgetUpdateInputInterface } from '../interface/budget-update-input.interface';
import type { BudgetCategoryLimitBulkUpdateInputInterface, BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

export class BudgetService {
    readonly createBudget = Effect.fn('BudgetService.createBudget')(
        function* (this: BudgetService, input: BudgetCreateInputInterface) {
            const { categoryLimits, ...budgetFields } = input;
            const createdBudget = yield* this.budgetRepository.create(budgetFields);

            yield* this.createCategoryLimits(createdBudget.id, categoryLimits);

            return createdBudget;
        },
        effect => Db.transaction(effect)
    );

    readonly updateBudget = Effect.fn('BudgetService.updateBudget')(
        function* (this: BudgetService, id: number, input: BudgetUpdateInputInterface) {
            const { categoryLimits, ...budgetFields } = input;
            const updatedBudget = yield* this.budgetRepository.update(id, budgetFields);

            yield* this.syncCategoryLimits(id, categoryLimits);

            return updatedBudget;
        },
        effect => Db.transaction(effect)
    );

    readonly deleteBudget = Effect.fn('BudgetService.deleteBudget')(function* (this: BudgetService, id: number) {
        yield* this.budgetRepository.delete(id);
    });

    private readonly createCategoryLimits = Effect.fnUntraced(function* (
        this: BudgetService,
        budgetId: number,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[]
    ) {
        if (isEmptyArray(categoryLimits)) {
            return;
        }

        yield* this.budgetCategoryLimitRepository.bulkCreate(
            categoryLimits.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount }))
        );
    });

    private readonly syncCategoryLimits = Effect.fnUntraced(function* (
        this: BudgetService,
        budgetId: number,
        categoryLimits: readonly BudgetCategoryLimitInputInterface[] | undefined
    ) {
        if (!isDefined(categoryLimits)) {
            return;
        }

        const existingLimits = yield* this.budgetCategoryLimitRepository.getByBudget(budgetId);
        const existingByCategory = new Map(existingLimits.map(limit => [limit.categoryId, limit]));
        const nextCategoryIds = new Set(categoryLimits.map(limit => limit.categoryId));
        const toCreate = categoryLimits.filter(next => !existingByCategory.has(next.categoryId));
        const toUpdate = this.buildCategoryLimitUpdates(categoryLimits, existingByCategory);
        const toDelete = existingLimits.filter(limit => !nextCategoryIds.has(limit.categoryId)).map(limit => limit.id);

        if (isNotEmptyArray(toCreate)) {
            yield* this.budgetCategoryLimitRepository.bulkCreate(
                toCreate.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount }))
            );
        }

        yield* this.budgetCategoryLimitRepository.bulkUpdate([...toUpdate]);
        yield* this.budgetCategoryLimitRepository.bulkDelete([...toDelete]);
    });

    constructor(
        private readonly budgetRepository: BudgetRepository,
        private readonly budgetCategoryLimitRepository: BudgetCategoryLimitRepository
    ) {}

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
