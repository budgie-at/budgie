// Port of tests/app-tests/flows/18.security-screenshot-protection.flow.yaml.
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';

test('18 security screenshot protection', { tags: ['security'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: '18.db' });

    await b.phase('enable screenshot protection', async () => {
        await s.openSettingsAnchor(ctx, 'security');
        await b.scrollTo(ctx, 'SettingsPage.ScreenshotProtectionCard');
        await b.tapId(ctx, 'SettingsPage.ScreenshotProtectionSwitch');
        await s.goHome(ctx);
    });

    await b.phase('setting persists', async () => {
        await s.openSettingsAnchor(ctx, 'security');
        await b.scrollTo(ctx, 'SettingsPage.ScreenshotProtectionSwitch');
        await expect(b.byId(ctx.screen, 'SettingsPage.ScreenshotProtectionSwitch')).toBeVisible();
        await s.goHome(ctx);
    });
});
