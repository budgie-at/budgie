import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { PENDING_ANDROID_PORT, test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('07 settings preferences', { tags: ['settings'], platforms: PENDING_ANDROID_PORT }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const pickLanguage = async (code: string) => {
        await a.openSettingsCard(ctx, /^SettingsPage\.LanguageCard\..+$/, `LanguageSelector.Option.${code}`);
        await b.scrollTo(ctx, `LanguageSelector.Option.${code}`);
        await b.tapId(ctx, `LanguageSelector.Option.${code}`);
        await b.expectNoId(ctx, `LanguageSelector.Option.${code}`, 3_000);
        await b.expectId(ctx, `SettingsPage.LanguageCard.${code}`, 10_000);
    };

    /**
     * Taps the show-cents card and waits for the setting to flip (its subtitle reads `£1,234.56 instead of £1,235` with cents on);
     * a tap that lands while the theme re-renders is repeated.
     */
    const toggleCents = async (on: boolean) => {
        const card = b.byId(screen, 'SettingsPage.ShowCentsCard');
        const name = on ? /^Show cents, \D*1,234\.56 instead of/ : /^Show cents, \D*1,235 instead of/;
        await b.tapUntil(ctx, 'SettingsPage.ShowCentsCard', () => expect(card).toHaveAccessibleName(name, { timeout: 3_000 }));
    };

    await budgie.start({ fixture: '07.db' });

    await b.phase('language', async () => {
        await b.openLink(ctx, 'budgie://settings?anchor=general');
        await b.expectId(ctx, 'SettingsPage.LanguageCard.en', 3_000);
        await pickLanguage('de');
        await pickLanguage('en');
    });

    await b.phase('main currency and default account', async () => {
        await a.openSettingsCard(ctx, /^SettingsPage\.MainCurrencyCard\..+$/, 'CurrencySelector.SearchInput');
        await b.expectSettledId(ctx, 'CurrencySelector.SearchInput');
        await b.fillId(ctx, 'CurrencySelector.SearchInput', 'GBP');
        await b.tapId(ctx, 'AccountForm.CurrencyOption.GBP');
        await b.expectNoId(ctx, 'CurrencySelector.SearchInput', 3_000);
        await b.expectId(ctx, 'SettingsPage.MainCurrencyCard.GBP', 3_000);

        await a.openSettingsCard(ctx, /^SettingsPage\.DefaultAccountCard\..+$/, 'AccountPickerBottomSheet.Input');
        await b.expectSettledId(ctx, 'AccountPickerBottomSheet.Input');
        await b.fillId(ctx, 'AccountPickerBottomSheet.Input', 'E2E Settings Cash');
        await b.done(ctx);
        await b.tapId(ctx, 'AccountPickerBottomSheet.Option.E2E Settings Cash');
        await b.expectNoId(ctx, 'AccountPickerBottomSheet.Input', 3_000);
        await expect(screen.getByTestId(/^SettingsPage\.DefaultAccountCard\.Selected\.[0-9]+\.E2E_Settings_Cash$/).first()).toBeVisible({
            timeout: 10_000
        });
    });

    await b.phase('appearance and cents', async () => {
        await b.scrollToCentre(ctx, 'SettingsPage.DarkModeCard');
        await b.expectId(ctx, 'SettingsPage.DarkModeCard');
        await b.tapText(ctx, 'Dark');
        await b.tapText(ctx, 'Light');
        await b.expectId(ctx, 'SettingsPage.ShowCentsCard');
        await b.scrollToCentre(ctx, 'SettingsPage.ShowCentsCard');
        await toggleCents(true);
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Settings_Bank.100_00', 10_000);
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Settings_Cash.250_00');
        await t.navigateToTransactions(ctx);
        await b.expectText(ctx, /\$100\.00/);
        await b.expectText(ctx, /\$250\.00/);

        await b.openLink(ctx, 'budgie://settings?anchor=appearance');
        await b.expectId(ctx, 'SettingsPage.ShowCentsCard', 10_000);
        await b.scrollToCentre(ctx, 'SettingsPage.ShowCentsCard');
        await toggleCents(false);
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Settings_Bank.100', 10_000);
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Settings_Cash.250');
    });

    await b.phase('default account on new expense', async () => {
        await t.navigateToTransactions(ctx);
        await t.openActionMenu(ctx);
        await b.tapId(ctx, 'ActionItem.Expense.Label');
        await b.expectId(ctx, 'TransactionForm.SelectedAccount.E2E_Settings_Cash', 10_000);
    });
});
