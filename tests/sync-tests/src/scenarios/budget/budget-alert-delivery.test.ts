import { BudgetAlertMonitorService } from '@app/budget/service/budget-alert-monitor.service';
import { updateSettingsMutation } from '@app/settings/mutation/update-settings.mutation';
import { makeTestPlatformLayer } from '@budgie-at/test-kit';
import { BudgetService } from '@budgie/budget';
import { AccountTypeEnum, BudgetPeriodEnum, PRECISION, SettingsRepository } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

const scheduledNotifications = vi.hoisted(() => vi.fn());

vi.mock('expo-notifications', () => ({
    AndroidImportance: { DEFAULT: 3 },
    scheduleNotificationAsync: scheduledNotifications,
    setNotificationChannelAsync: vi.fn()
}));

const BudgetAlertLayer = Layer.mergeAll(BudgetAlertMonitorService.layer, BudgetService.layer, SettingsRepository.layer).pipe(
    Layer.provideMerge(makeTestPlatformLayer(testDb))
);

const OVERALL_LIMIT = 100 * PRECISION;
const OTHER_LIMIT = 10 * PRECISION;
const FIRED_TRIGGERS = 4;

layer(BudgetAlertLayer)('budget/alert-delivery', it => {
    it.effect('delivers every crossed threshold exactly once across consecutive runs', () =>
        Effect.gen(function* () {
            scheduledNotifications.mockClear();
            const budgetService = yield* BudgetService;
            const monitor = yield* BudgetAlertMonitorService;
            const account = yield* seed.account({ type: AccountTypeEnum.BANK_SYNC, instrumentId: 1 });

            yield* updateSettingsMutation({ isBudgetPushEnabled: true });
            yield* budgetService.createBudget({
                name: 'Monthly Budget',
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 1,
                useLastDayOfMonth: false,
                overallLimit: OVERALL_LIMIT,
                otherLimit: OTHER_LIMIT,
                instrumentId: 1,
                categoryLimits: []
            });
            yield* seed.bankPairExpense(
                { externalId: 'budget-alert', operatedAt: new Date() },
                { accountId: account.id, amount: OVERALL_LIMIT }
            );

            yield* monitor.run();
            yield* monitor.run();

            expect(scheduledNotifications).toHaveBeenCalledTimes(FIRED_TRIGGERS);
        })
    );
});
