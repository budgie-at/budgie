import { Db } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { defaultPeriodAnchorDate } from '../../period/utils/default-period-anchor-date.util';
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
            existingByCategory: ReadonlyMap<number, BudgetCategoryLimitEntityInterface>,
            editedAt: Date
        ): BudgetCategoryLimitBulkUpdateInputInterface[] =>
            categoryLimits
                .map(next => {
                    const existing = existingByCategory.get(next.categoryId);

                    if (!isDefined(existing)) {
                        return null;
                    }

                    const hasLimitChanged = existing.limitAmount !== next.limitAmount;
                    const hasRolloverChanged = isDefined(next.rolloverMode) && existing.rolloverMode !== next.rolloverMode;

                    if (!hasLimitChanged && !hasRolloverChanged) {
                        return null;
                    }

                    return {
                        id: existing.id,
                        limitAmount: next.limitAmount,
                        rolloverMode: next.rolloverMode,
                        ...(hasLimitChanged && { userEditedAt: editedAt })
                    };
                })
                .filter(isDefined);

        const createCategoryLimits = Effect.fnUntraced(function* (
            budgetId: number,
            categoryLimits: readonly BudgetCategoryLimitInputInterface[],
            editedAt: Date
        ) {
            if (isEmptyArray(categoryLimits)) {
                return;
            }

            yield* budgetCategoryLimitRepository.bulkCreate(categoryLimits.map(limit => ({ budgetId, ...limit, userEditedAt: editedAt })));
        });

        const syncCategoryLimits = Effect.fnUntraced(function* (
            budgetId: number,
            categoryLimits: readonly BudgetCategoryLimitInputInterface[] | undefined,
            editedAt: Date
        ) {
            if (!isDefined(categoryLimits)) {
                return;
            }

            const existingLimits = yield* budgetCategoryLimitRepository.getByBudget(budgetId);
            const existingByCategory = new Map(existingLimits.map(limit => [limit.categoryId, limit]));
            const nextCategoryIds = new Set(categoryLimits.map(limit => limit.categoryId));
            const toCreate = categoryLimits.filter(next => !existingByCategory.has(next.categoryId));
            const toUpdate = buildCategoryLimitUpdates(categoryLimits, existingByCategory, editedAt);
            const toDelete = existingLimits.filter(limit => !nextCategoryIds.has(limit.categoryId)).map(limit => limit.id);

            if (isNotEmptyArray(toCreate)) {
                yield* budgetCategoryLimitRepository.bulkCreate(toCreate.map(limit => ({ budgetId, ...limit, userEditedAt: editedAt })));
            }

            yield* budgetCategoryLimitRepository.bulkUpdate([...toUpdate]);
            yield* budgetCategoryLimitRepository.bulkDelete([...toDelete]);
        });

        return {
            createBudget: Effect.fn('BudgetService.createBudget')(
                function* (input: BudgetCreateInputInterface) {
                    const { categoryLimits, ...budgetFields } = input;
                    const editedAt = new Date();
                    const periodAnchorDate = budgetFields.periodAnchorDate ?? defaultPeriodAnchorDate(budgetFields.period, editedAt);
                    const createdBudget = yield* budgetRepository.create({
                        ...budgetFields,
                        periodAnchorDate,
                        otherLimitUserEditedAt: editedAt
                    });

                    yield* createCategoryLimits(createdBudget.id, categoryLimits, editedAt);

                    return createdBudget;
                },
                effect => Db.transaction(effect)
            ),
            updateBudget: Effect.fn('BudgetService.updateBudget')(
                function* (id: number, input: BudgetUpdateInputInterface) {
                    const { categoryLimits, ...budgetFields } = input;
                    const editedAt = new Date();
                    const existingBudget = yield* budgetRepository.findById(id);
                    const periodAnchorDate =
                        isDefined(budgetFields.period) &&
                        isDefined(existingBudget) &&
                        existingBudget.period !== budgetFields.period &&
                        !isDefined(budgetFields.periodAnchorDate)
                            ? defaultPeriodAnchorDate(budgetFields.period, editedAt)
                            : budgetFields.periodAnchorDate;
                    const hasOtherLimitChanged =
                        isDefined(existingBudget) &&
                        isDefined(budgetFields.otherLimit) &&
                        existingBudget.otherLimit !== budgetFields.otherLimit;
                    const updatedBudget = yield* budgetRepository.update(id, {
                        ...budgetFields,
                        ...(hasOtherLimitChanged && { otherLimitUserEditedAt: editedAt }),
                        ...(isDefined(periodAnchorDate) && { periodAnchorDate })
                    });

                    yield* syncCategoryLimits(id, categoryLimits, editedAt);

                    return updatedBudget;
                },
                effect => Db.transaction(effect)
            ),
            deleteBudget: (id: number) => Db.transaction(budgetRepository.delete(id))
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetService, BudgetService.make).pipe(
        Layer.provide([BudgetRepository.layer, BudgetCategoryLimitRepository.layer])
    );
}
