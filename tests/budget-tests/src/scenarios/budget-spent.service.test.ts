import { budgetSpentService } from '@budgie/budget';

describe('budgetSpentService', () => {
    it('converts entries to the budget instrument and groups categorized spend', () => {
        const spent = budgetSpentService.computeSpent(
            [
                { amount: 10_000_000, categoryId: 11, instrumentId: 1, rate: null },
                { amount: 20_000_000, categoryId: 11, instrumentId: 2, rate: 2 },
                { amount: 5_000_000, categoryId: null, instrumentId: 2, rate: 2 }
            ],
            1
        );

        expect(spent).toEqual({
            spentOverall: 60_000_000,
            spentByCategory: [{ categoryId: 11, spent: 50_000_000 }]
        });
    });
});
