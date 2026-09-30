import { AccountService } from '@app/account/service/account.service';
import { OnboardingService } from '@app/onboarding/service/onboarding.service';
import { updateSettingsMutation } from '@app/settings/mutation/update-settings.mutation';
import { BudgetRepository, BudgetService } from '@budgie/budget';
import { AccountRepository, BudgetPeriodEnum, Db, SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';

import { seed, TestLayer } from '../../harness';

const countSettledTransactionBoundaries = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.gen(function* () {
        const settledBoundaries = yield* Ref.make(0);

        yield* effect.pipe(
            Effect.provideService(Db.TransactionBoundary, inner =>
                Effect.ensuring(
                    inner,
                    Ref.update(settledBoundaries, count => count + 1)
                )
            )
        );

        return yield* Ref.get(settledBoundaries);
    });

describe('settings/user-write-live-refresh', () => {
    it.effect('settles deleteBudget through the transaction boundary so live budget reads refresh before it returns', () =>
        Effect.gen(function* () {
            const budgetService = yield* BudgetService;
            const budgetRepository = yield* BudgetRepository;
            const budget = yield* budgetService.createBudget({
                name: 'Monthly Budget',
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 1,
                useLastDayOfMonth: false,
                overallLimit: 1_000_000_000,
                otherLimit: 0,
                instrumentId: 1,
                categoryLimits: []
            });

            expect(yield* countSettledTransactionBoundaries(budgetService.deleteBudget(budget.id))).toBe(1);
            expect(yield* budgetRepository.findActive()).toBeUndefined();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('settles onboarding completion and settings updates through the transaction boundary', () =>
        Effect.gen(function* () {
            const onboardingService = yield* OnboardingService;
            const settingsRepository = yield* SettingsRepository;

            expect(yield* countSettledTransactionBoundaries(onboardingService.complete())).toBe(1);
            expect((yield* settingsRepository.getSettings()).isOnboardingCompleted).toBe(true);

            expect(yield* countSettledTransactionBoundaries(updateSettingsMutation({ isBudgetWidgetEnabled: false }))).toBe(1);
            expect((yield* settingsRepository.getSettings()).isBudgetWidgetEnabled).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('settles account activation through the transaction boundary', () =>
        Effect.gen(function* () {
            const accountService = yield* AccountService;
            const accountRepository = yield* AccountRepository;
            const account = seed.account({ title: 'Inactive', isActive: false });

            expect(yield* countSettledTransactionBoundaries(accountService.activateById(account.id))).toBe(1);
            expect((yield* accountRepository.findById(account.id))?.isActive).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );
});
