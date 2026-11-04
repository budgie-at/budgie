// Port of tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml.
// The Maestro flow imports nothing and runs on whatever the previous flow left; this starts on an empty home.
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('29 apple pay capture settings', { tags: ['settings'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    await budgie.start({ fixture: '18.db' });

    await b.phase('open apple pay capture settings', async () => {
        await b.openLink(ctx, 'budgie://settings?anchor=general');
        await b.scrollTo(ctx, 'SettingsPage.ApplePayCaptureCard');
        await b.tapId(ctx, 'SettingsPage.ApplePayCaptureCard');
        await b.expectId(ctx, 'ApplePayCaptureSettings.Container', 10_000);
        await b.expectText(ctx, /^Apple Pay capture$/i);
        await b.expectText(ctx, 'Record Apple Pay purchases');
    });

    await b.phase('shortcuts and guide', async () => {
        await b.scrollTo(ctx, 'ApplePayCaptureSettings.OpenShortcutsButton');
        await b.expectId(ctx, 'ApplePayCaptureSettings.OpenShortcutsButton');
        await b.scrollTo(ctx, 'ApplePayCaptureSettings.InstructionsGuideLink');
        await b.expectId(ctx, 'ApplePayCaptureSettings.InstructionsGuideLink');
        await screen.scrollUntilVisible(b.byText(screen, /can't import Wallet history/i), { direction: 'down', timeout: 20_000 });
        await expect(b.byText(screen, /can't import Wallet history/i)).toBeVisible();
    });
});
