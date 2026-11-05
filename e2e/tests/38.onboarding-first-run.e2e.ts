import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('38 onboarding first run', { tags: ['onboarding'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: '38-onboarding.db', wait: 'none' });

    await b.phase('welcome, key, phone lock', async () => {
        await b.expectId(ctx, 'OnboardingWelcome.StartButton', 30_000);
        await b.tapId(ctx, 'OnboardingWelcome.StartButton');
        await b.expectId(ctx, 'OnboardingKey.PhoneLockOption', 3_000);
        await b.tapId(ctx, 'OnboardingKey.PhoneLockOption');
        await b.expectId(ctx, 'OnboardingPhoneLock.ContinueButton', 3_000);
        await b.tapId(ctx, 'OnboardingPhoneLock.ContinueButton');
    });

    await b.phase('accounts and balances', async () => {
        await b.expectId(ctx, 'OnboardingAccounts.CASH', 3_000);
        await b.tapId(ctx, 'OnboardingAccounts.CASH');
        await b.tapId(ctx, 'OnboardingAccounts.BANK');
        await b.tapId(ctx, 'OnboardingAccounts.AddButton');
        await b.expectId(ctx, 'OnboardingBalances.LaterButton', 3_000);
        await b.fillId(ctx, 'OnboardingBalanceRow.1.Amount', '1234567.89');
        await b.expectText(ctx, 'Done', 3_000);
        await b.tapText(ctx, 'Done');
        await b.expectText(ctx, 'Save balances', 3_000);
        await b.tapId(ctx, 'OnboardingStepLayout.BackButton');
        await b.expectId(ctx, 'OnboardingAccounts.CASH', 3_000);
        await b.tapId(ctx, 'OnboardingAccounts.AddButton');
        await b.expectId(ctx, 'OnboardingBalances.LaterButton', 3_000);
        await b.tapId(ctx, 'OnboardingBalances.LaterButton');
    });

    await b.phase('ai step, home', async () => {
        await b.expectId(ctx, 'OnboardingAi.NoThanksButton', 3_000);
        await b.tapId(ctx, 'OnboardingAi.NoThanksButton');
        await b.expectId(ctx, 'HomePage.TotalBalance', 30_000);
        await b.expectId(ctx, 'SecurityLockButton.Root');
        await b.expectNoId(ctx, 'AccountsEmptyState.AddAccountButton');
    });

    await b.phase('onboarding deep link is a no-op after first run', async () => {
        await b.openLink(ctx, 'budgie://onboarding');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await b.expectNoId(ctx, 'OnboardingKey.PhoneLockOption');
    });
});
