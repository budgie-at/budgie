import * as b from '../support/budgie/core.ts';
import { enterPin } from '../support/budgie/security.ts';
import { test } from '../support/budgie/test.ts';

test('38 onboarding PIN seal', { tags: ['onboarding'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: '38-onboarding.db', wait: 'none' });

    await b.phase('create and confirm PIN', async () => {
        await b.expectId(ctx, 'OnboardingWelcome.StartButton', 30_000);
        await b.tapId(ctx, 'OnboardingWelcome.StartButton');
        await b.expectId(ctx, 'OnboardingKey.PinOption', 3_000);
        await b.tapId(ctx, 'OnboardingKey.PinOption');
        await b.expectId(ctx, 'PinPage.Digit.1', 3_000);
        await enterPin(ctx, '1234');
        await b.expectText(ctx, 'Confirm your PIN', 3_000);
        await enterPin(ctx, '4321');
        await b.expectText(ctx, "PINs don't match. Try again.", 3_000);
        await b.tapId(ctx, 'OnboardingStepLayout.BackButton');
        await b.expectText(ctx, 'Choose a PIN', 3_000);
        await enterPin(ctx, '1234');
        await ctx.screen.getByRole('button', { name: 'Choose a different PIN', exact: true }).first().tap();
        await b.expectText(ctx, 'Choose a PIN', 3_000);
        await enterPin(ctx, '1234');
        await enterPin(ctx, '1234');
    });

    await b.phase('seal and review receipt', async () => {
        await b.expectId(ctx, 'OnboardingSeal.HoldButton', 3_000);
        await b.tapId(ctx, 'OnboardingSeal.HoldButton');
        await b.expectId(ctx, 'OnboardingSealedMoment.ContinueButton', 30_000);
        await b.tapUntil(ctx, 'OnboardingSealedMoment.ContinueButton', () => b.expectId(ctx, 'OnboardingReceipt.GoToBudgieButton', 3_000));
        await b.tapId(ctx, 'OnboardingReceipt.GoToBudgieButton');
        await b.expectId(ctx, 'AccountsEmptyState.AddAccountButton', 30_000);
    });
});
