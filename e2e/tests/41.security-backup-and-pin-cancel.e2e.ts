// Port of tests/app-tests/flows/41.security-backup-and-pin-cancel.flow.yaml.
import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as sec from '../support/budgie/security.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';

test('41 security backup and pin cancel', { tags: ['security'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: '17.db' });

    await b.phase('backup share sheet dismissed', async () => {
        await a.navigateToSettings(ctx);
        await b.expectId(ctx, 'SettingsPage.DataEncryption.State.Off', 5_000);
        await b.tapId(ctx, 'SettingsPage.DataBackupButton');
        await sec.dismissSaveToFilesSheet(ctx);
        await b.expectId(ctx, 'SettingsPage.Container', 5_000);
        await b.expectNoId(ctx, 'PinPage.Container');
        await b.expectId(ctx, 'SettingsPage.DataEncryption.State.Off');
    });

    await b.phase('pin setup cancelled', async () => {
        await a.openSettingsCard(ctx, 'SettingsPage.AppLockCard', 'PinPage.Container');
        await b.tapId(ctx, 'PinPage.Digit.1');
        await b.tapId(ctx, 'PinPage.Digit.2');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'SettingsPage.Container', 5_000);
        await b.expectId(ctx, 'SettingsPage.DataEncryption.State.Off');
        await expect(b.byId(ctx.screen, 'SettingsPage.AppLockCard')).toBeVisible();
        await s.goHome(ctx);
    });
});
