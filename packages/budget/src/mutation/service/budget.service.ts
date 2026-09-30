import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { BudgetCategoryLimitRepository } from '../../query/repository/budget-category-limit.repository';
import { BudgetRepository } from '../../query/repository/budget.repository';

import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetCreateInputInterface } from '../interface/budget-create-input.interface';
import type { BudgetUpdateInputInterface } from '../interface/budget-update-input.interface';
import type { BudgetCategoryLimitBulkUpdateInputInterface, BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

export class BudgetService extends Context.Service<BudgetService>()('@budgie/budget/BudgetService', {
    make: Effect.gen(function* () {
        const budgetRepository = yield* BudgetRepository;
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;

        const buildCategoryLimitUpdates = (
            categoryLimits: readonly BudgetCategoryLimitInputInterface[],
            existingByCategory: ReadonlyMap<number, BudgetCategoryLimitEntityInterface>
        ): BudgetCategoryLimitBulkUpdateInputInterface[] =>
            categoryLimits
                .map(next => {
                    const existing = existingByCategory.get(next.categoryId);

                    return isDefined(existing) && existing.limitAmount !== next.limitAmount
                        ? { id: existing.id, limitAmount: next.limitAmount }
                        : null;
                })
                .filter(isDefined);

        const createCategoryLimits = Effect.fnUntraced(function* (
            budgetId: number,
            categoryLimits: readonly BudgetCategoryLimitInputInterface[]
        ) {
            if (isEmptyArray(categoryLimits)) {
                return;
            }

            yield* budgetCategoryLimitRepository.bulkCreate(
                categoryLimits.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount }))
            );
        });

        const syncCategoryLimits = Effect.fnUntraced(function* (
            budgetId: number,
            categoryLimits: readonly BudgetCategoryLimitInputInterface[] | undefined
        ) {
            if (!isDefined(categoryLimits)) {
                return;
            }

            const existingLimits = yield* budgetCategoryLimitRepository.getByBudget(budgetId);
            const existingByCategory = new Map(existingLimits.map(limit => [limit.categoryId, limit]));
            const nextCategoryIds = new Set(categoryLimits.map(limit => limit.categoryId));
            const toCreate = categoryLimits.filter(next => !existingByCategory.has(next.categoryId));
            const toUpdate = buildCategoryLimitUpdates(categoryLimits, existingByCategory);
            const toDelete = existingLimits.filter(limit => !nextCategoryIds.has(limit.categoryId)).map(limit => limit.id);

            if (isNotEmptyArray(toCreate)) {
                yield* budgetCategoryLimitRepository.bulkCreate(
                    toCreate.map(limit => ({ budgetId, categoryId: limit.categoryId, limitAmount: limit.limitAmount }))
                );
            }

            yield* budgetCategoryLimitRepository.bulkUpdate([...toUpdate]);
            yield* budgetCategoryLimitRepository.bulkDelete([...toDelete]);
        });

        return {
            createBudget: Effect.fn('BudgetService.createBudget')(
                function* (input: BudgetCreateInputInterface) {
                    const { categoryLimits, ...budgetFields } = input;
                    const createdBudget = yield* budgetRepository.create(budgetFields);

                    yield* createCategoryLimits(createdBudget.id, categoryLimits);

                    return createdBudget;
                },
                effect => Db.transaction(effect)
            ),
            updateBudget: Effect.fn('BudgetService.updateBudget')(
                function* (id: number, input: BudgetUpdateInputInterface) {
                    const { categoryLimits, ...budgetFields } = input;
                    const updatedBudget = yield* budgetRepository.update(id, budgetFields);

                    yield* syncCategoryLimits(id, categoryLimits);

                    return updatedBudget;
                },
                effect => Db.transaction(effect)
            ),
            deleteBudget: Effect.fn('BudgetService.deleteBudget')(function* (id: number) {
                yield* budgetRepository.delete(id);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetService, BudgetService.make).pipe(
        Layer.provide([BudgetRepository.layer, BudgetCategoryLimitRepository.layer])
    );
}
