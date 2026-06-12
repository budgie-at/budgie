import { budgetCategoryLimitDiffService } from '@budgie/budget';

describe('budgetCategoryLimitDiffService', () => {
    it('plans category limit creates, updates, and deletes by category identity', () => {
        const diff = budgetCategoryLimitDiffService.diffCategoryLimits(
            [
                { id: 1, categoryId: 10, limitAmount: 100 },
                { id: 2, categoryId: 20, limitAmount: 200 },
                { id: 3, categoryId: 30, limitAmount: 300 }
            ],
            [
                { categoryId: 10, limitAmount: 100 },
                { categoryId: 20, limitAmount: 250 },
                { categoryId: 40, limitAmount: 400 }
            ]
        );

        expect(diff).toEqual({
            toCreate: [{ categoryId: 40, limitAmount: 400 }],
            toUpdate: [{ id: 2, limitAmount: 250 }],
            toDelete: [3]
        });
    });
});
