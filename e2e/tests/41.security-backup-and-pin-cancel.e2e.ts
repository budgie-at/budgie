import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as sec from '../support/budgie/security.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';

test('41 security backup and pin cancel', { tags: ['security'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: '17.db' });

    await b.phase('backup directory picker cancelled', async () => {
        await a.navigateToSettings(ctx);
        await b.expectId(ctx, 'SettingsPage.DataEncryption.State.Off', 5_000);
        await b.expectText(ctx, 'Not saved yet');
        await b.tapId(ctx, 'SettingsPage.DataBackupButton');
        await sec.cancelBackupFolderPicker(ctx);
        await b.expectText(ctx, 'Not saved yet');
        await expect(b.byId(ctx.screen, 'SettingsPage.DataBackupButton')).toBeEnabled();
        await expect(b.byId(ctx.screen, b.TOAST)).toBeHidden({ timeout: 100 });
        await b.expectId(ctx, 'SettingsPage.Container', 5_000);
        await b.expectNoId(ctx, 'PinPage.Container');
        await b.expectId(ctx, 'SettingsPage.DataEncryption.State.Off');
    });

    await b.phase('backup saved to chosen directory', async () => {
        await b.tapId(ctx, 'SettingsPage.DataBackupButton');
        await sec.saveBackupToFixtureDirectory(ctx);
        await b.expectText(ctx, 'Backup saved', 15_000);
        await b.expectText(ctx, /^Last saved /);
        await b.expectId(ctx, 'SettingsPage.Container');
        await b.expectNoId(ctx, b.TOAST, 8_000);
    });

    await b.phase('send a copy does not record another backup', async () => {
        const savedLabel = await b.byText(ctx.screen, /^Last saved /).textContent();
        await b.tapId(ctx, 'SettingsPage.DataBackupShareButton');
        await sec.dismissSaveToFilesSheet(ctx);
        await expect(b.byText(ctx.screen, /^Last saved /)).toHaveText(savedLabel ?? '');
        await expect(b.byId(ctx.screen, 'SettingsPage.DataBackupButton')).toBeEnabled();
        await expect(b.byId(ctx.screen, b.TOAST)).toBeHidden({ timeout: 100 });
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
