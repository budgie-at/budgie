import { BudgetService } from '@budgie/budget';

import { isDefined } from '@rnw-community/shared';

import { BudgetPeriodEnum } from '../../../../packages/contracts/src/budget/enum/budget-period.enum';

import type { BudgetCreateEntityInterface } from '../../../../packages/contracts/src/budget/entity/budget-create-entity.interface';
import type { BudgetEntityInterface } from '../../../../packages/contracts/src/budget/entity/budget-entity.interface';
import type { BudgetUpdateEntityInterface } from '../../../../packages/contracts/src/budget/entity/budget-update-entity.interface';
import type { BudgetCategoryLimitCreateEntityInterface } from '../../../../packages/contracts/src/budget-category-limit/entity/budget-category-limit-create-entity.interface';
import type { BudgetCategoryLimitEntityInterface } from '../../../../packages/contracts/src/budget-category-limit/entity/budget-category-limit-entity.interface';
import type { BudgetCategoryLimitBulkUpdateInputInterface } from '../../../../packages/contracts/src/budget-category-limit/input/budget-category-limit-bulk-update-input.interface';

const CREATED_AT = new Date('2026-06-12T12:00:00.000Z');
const UPDATED_AT = new Date('2026-06-12T13:00:00.000Z');
const DELETED_AT = new Date('2026-06-12T14:00:00.000Z');
const INITIAL_OVERALL_LIMIT = 100_000_000;
const INITIAL_OTHER_LIMIT = 20_000_000;
const UPDATED_OVERALL_LIMIT = 120_000_000;
const UPDATED_OTHER_LIMIT = 30_000_000;
const FIRST_CATEGORY_ID = 11;
const SECOND_CATEGORY_ID = 12;
const THIRD_CATEGORY_ID = 13;
const FIRST_INITIAL_LIMIT = 30_000_000;
const SECOND_INITIAL_LIMIT = 40_000_000;
const FIRST_UPDATED_LIMIT = 35_000_000;
const THIRD_UPDATED_LIMIT = 45_000_000;

interface TestBudgetTransactionInterface {
    readonly name: string;
}

const buildBudgetRepository = () => {
    let nextId = 1;
    let budget: BudgetEntityInterface | null = null;

    const requireBudget = (id: number): BudgetEntityInterface => {
        if (!isDefined(budget) || budget.id !== id) {
            throw new Error(`Budget ${id} not found`);
        }

        return budget;
    };

    return {
        create: async (input: BudgetCreateEntityInterface): Promise<BudgetEntityInterface> => {
            const createdBudget = { ...input, id: nextId, createdAt: CREATED_AT, updatedAt: CREATED_AT, deletedAt: null };
            nextId += 1;
            budget = createdBudget;

            return createdBudget;
        },
        update: async (id: number, input: BudgetUpdateEntityInterface): Promise<BudgetEntityInterface> => {
            const existingBudget = requireBudget(id);
            const updatedBudget = { ...existingBudget, ...input, updatedAt: UPDATED_AT };
            budget = updatedBudget;

            return updatedBudget;
        },
        delete: async (id: number): Promise<void> => {
            const existingBudget = requireBudget(id);
            budget = { ...existingBudget, deletedAt: DELETED_AT };
        },
        getActive: (): BudgetEntityInterface | null => {
            if (!isDefined(budget) || isDefined(budget.deletedAt)) {
                return null;
            }

            return budget;
        }
    };
};

const buildBudgetCategoryLimitRepository = () => {
    let nextId = 1;
    let limits: BudgetCategoryLimitEntityInterface[] = [];

    return {
        bulkCreate: async (inputs: BudgetCategoryLimitCreateEntityInterface[]): Promise<BudgetCategoryLimitEntityInterface[]> => {
            const createdLimits = inputs.map(input => {
                const limit = { ...input, id: nextId, createdAt: CREATED_AT, updatedAt: CREATED_AT, deletedAt: null };
                nextId += 1;

                return limit;
            });
            limits = [...limits, ...createdLimits];

            return createdLimits;
        },
        bulkUpdate: async (updates: BudgetCategoryLimitBulkUpdateInputInterface[]): Promise<BudgetCategoryLimitEntityInterface[]> => {
            const updatedLimits: BudgetCategoryLimitEntityInterface[] = [];
            limits = limits.map(limit => {
                const update = updates.find(item => item.id === limit.id);

                if (!isDefined(update)) {
                    return limit;
                }

                const updatedLimit = { ...limit, limitAmount: update.limitAmount, updatedAt: UPDATED_AT };
                updatedLimits.push(updatedLimit);

                return updatedLimit;
            });

            return updatedLimits;
        },
        bulkDelete: async (ids: number[]): Promise<void> => {
            limits = limits.map(limit => {
                if (ids.includes(limit.id)) {
                    return { ...limit, deletedAt: DELETED_AT };
                }

                return limit;
            });
        },
        getByBudget: async (budgetId: number): Promise<BudgetCategoryLimitEntityInterface[]> =>
            limits.filter(limit => limit.budgetId === budgetId && !isDefined(limit.deletedAt))
    };
};

const buildBudgetService = () => {
    const database = { name: 'database' };
    const budgetRepository = buildBudgetRepository();
    const budgetCategoryLimitRepository = buildBudgetCategoryLimitRepository();
    const runTransaction = async <T>(
        databaseInput: TestBudgetTransactionInterface,
        callback: (transaction: TestBudgetTransactionInterface) => Promise<T>
    ): Promise<T> => callback(databaseInput);
    const budgetService = new BudgetService(database, budgetRepository, budgetCategoryLimitRepository, runTransaction);

    return { budgetService, budgetRepository, budgetCategoryLimitRepository };
};

describe('BudgetService', () => {
    it('creates and updates a budget with category limits through the injected transaction boundary', async () => {
        const { budgetService, budgetRepository, budgetCategoryLimitRepository } = buildBudgetService();
        const budget = await budgetService.createBudget({
            name: 'Monthly Budget',
            period: BudgetPeriodEnum.MONTHLY,
            periodStartDay: 1,
            useLastDayOfMonth: false,
            overallLimit: INITIAL_OVERALL_LIMIT,
            otherLimit: INITIAL_OTHER_LIMIT,
            instrumentId: 1,
            categoryLimits: [
                { categoryId: FIRST_CATEGORY_ID, limitAmount: FIRST_INITIAL_LIMIT },
                { categoryId: SECOND_CATEGORY_ID, limitAmount: SECOND_INITIAL_LIMIT }
            ]
        });

        const updatedBudget = await budgetService.updateBudget(budget.id, {
            name: 'Updated Budget',
            overallLimit: UPDATED_OVERALL_LIMIT,
            otherLimit: UPDATED_OTHER_LIMIT,
            categoryLimits: [
                { categoryId: FIRST_CATEGORY_ID, limitAmount: FIRST_UPDATED_LIMIT },
                { categoryId: THIRD_CATEGORY_ID, limitAmount: THIRD_UPDATED_LIMIT }
            ]
        });
        const activeBudget = budgetRepository.getActive();
        const categoryLimits = await budgetCategoryLimitRepository.getByBudget(budget.id);

        expect(updatedBudget.name).toBe('Updated Budget');
        expect(updatedBudget.overallLimit).toBe(UPDATED_OVERALL_LIMIT);
        expect(updatedBudget.otherLimit).toBe(UPDATED_OTHER_LIMIT);
        expect(activeBudget?.id).toBe(budget.id);
        expect(categoryLimits.map(limit => ({ categoryId: limit.categoryId, limitAmount: limit.limitAmount }))).toEqual([
            { categoryId: FIRST_CATEGORY_ID, limitAmount: FIRST_UPDATED_LIMIT },
            { categoryId: THIRD_CATEGORY_ID, limitAmount: THIRD_UPDATED_LIMIT }
        ]);
    });
});
