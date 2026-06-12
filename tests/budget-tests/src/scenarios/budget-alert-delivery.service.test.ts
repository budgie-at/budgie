import { BudgetAlertDeliveryService, BudgetAlertScopeEnum, budgetPeriodService } from '@budgie/budget';

class MemoryBudgetAlertStorage {
    private readonly values = new Map<string, string>();

    async getItem(key: string): Promise<string | null> {
        return this.values.get(key) ?? null;
    }

    async setItem(key: string, value: string): Promise<void> {
        this.values.set(key, value);
    }
}

describe('BudgetAlertDeliveryService', () => {
    it('filters triggers already delivered for the current budget period', async () => {
        const storage = new MemoryBudgetAlertStorage();
        const service = new BudgetAlertDeliveryService(storage, () => new Date('2026-06-12T12:00:00.000Z'));
        const budget = {
            id: 7,
            periodStartDay: 1,
            useLastDayOfMonth: false,
            overallLimit: 100_000_000,
            otherLimit: 20_000_000
        };
        const spent = {
            spentOverall: 90_000_000,
            spentByCategory: [{ categoryId: 11, spent: 50_000_000 }]
        };
        const categoryLimits = [{ categoryId: 11, limitAmount: 50_000_000 }];
        const triggers = await service.evaluate(budget, spent, categoryLimits);

        const periodStartMs = budgetPeriodService.computePeriodWindow(1, false, new Date('2026-06-12T12:00:00.000Z')).periodStart.getTime();

        await service.markDelivered(7, periodStartMs, [triggers[0]]);
        const remainingTriggers = await service.evaluate(budget, spent, categoryLimits);

        expect(triggers).toContainEqual({ scope: BudgetAlertScopeEnum.OVERALL, categoryId: null, threshold: 80 });
        expect(remainingTriggers).not.toContainEqual({ scope: BudgetAlertScopeEnum.OVERALL, categoryId: null, threshold: 80 });
        expect(remainingTriggers).toContainEqual({ scope: BudgetAlertScopeEnum.CATEGORY, categoryId: 11, threshold: 100 });
    });
});
