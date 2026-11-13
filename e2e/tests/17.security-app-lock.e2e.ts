import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as sec from '../support/budgie/security.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';

test('17 security app lock', { tags: ['security'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const pinPage = () => b.expectId(ctx, 'PinPage.Container', 10_000);
    const typed = (text: string) => expect(screen.getByText(text).or(screen.getByDisplayValue(text)).first()).toBeVisible();

    await budgie.start({ fixture: '17.db' });

    await b.phase('set pin', async () => {
        await a.navigateToSettings(ctx);
        await b.expectId(ctx, 'SettingsPage.DataEncryption.State.Off', 3_000);
        await b.expectNoId(ctx, 'Icon.Fallback');
        await a.openSettingsCard(ctx, 'SettingsPage.AppLockCard', 'PinPage.Container');
        await pinPage();
        await sec.enterPin(ctx, '1234');
        await pinPage();
        await sec.enterPin(ctx, '1234');
        await b.expectText(ctx, 'Enter your PIN');
    });

    await b.phase('lockout, unlock', async () => {
        await sec.exhaustPinAttempts(ctx);
        await sec.enterPin(ctx, '1234');
        await b.expectId(ctx, 'TabBar.Settings', 10_000);
        await a.navigateToSettings(ctx);
        await b.expectId(ctx, 'SettingsPage.DataEncryption.State.On', 3_000);
    });

    await b.phase('unfinished form survives a lock', async () => {
        await a.openNewAccount(ctx);
        await b.tapId(ctx, 'CreateAccount.BANK');
        await b.expectId(ctx, 'AccountForm.NameInput', 3_000);
        await b.fillId(ctx, 'AccountForm.NameInput', 'Unfinished lock regression');
        await sec.resumeAfterPinUnlock(ctx, 'AccountForm.NameInput');
        await typed('Unfinished lock regression');
        await b.scrollTo(ctx, 'AccountForm.CurrencySelector');
        await b.tapId(ctx, 'AccountForm.CurrencySelector');
        await b.expectId(ctx, 'CurrencySelector.SearchInput', 3_000);
        await b.expectSettledId(ctx, 'CurrencySelector.SearchInput');
        await b.fillId(ctx, 'CurrencySelector.SearchInput', 'EUR');
        await sec.resumeAfterPinUnlock(ctx, 'CurrencySelector.SearchInput');
        await typed('EUR');
        await b.tapId(ctx, 'AccountForm.CurrencyOption.EUR');
        await b.expectId(ctx, 'AccountForm.NameInput', 3_000);
        await typed('Unfinished lock regression');
        await b.tapId(ctx, 'PageHeader.BackButton');
    });

    await b.phase('change pin', async () => {
        await a.navigateToSettings(ctx);
        await a.openSettingsCard(ctx, 'SettingsPage.AppLockChangePinButton', 'PinPage.Container');
        await pinPage();
        await sec.exhaustPinAttempts(ctx);
        await sec.enterPin(ctx, '1234');
        await pinPage();
        await sec.enterPin(ctx, '5678');
        await pinPage();
        await sec.enterPin(ctx, '5678');
        await b.expectText(ctx, 'Enter your PIN');
        await sec.enterPin(ctx, '1234');
        await b.expectId(ctx, 'PinPage.Error', 10_000);
        await sec.enterPin(ctx, '5678');
        await b.expectId(ctx, 'TabBar.Settings', 10_000);
    });

    await b.phase('disable lock', async () => {
        await a.navigateToSettings(ctx);
        await a.openSettingsCard(ctx, 'SettingsPage.AppLockDisableButton', 'PinPage.Container');
        await pinPage();
        await sec.enterPin(ctx, '5678');
        await b.expectId(ctx, 'TabBar.Settings', 10_000);
        await s.goHome(ctx);
    });
});
