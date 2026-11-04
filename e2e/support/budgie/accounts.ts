import { tapUntil } from '@mobile-ci/e2e-simlock/steps';
import { expect } from 'e2e';

import {
    byId,
    byText,
    done,
    expectId,
    expectNoId,
    openLink,
    scrollTo,
    scrollToCentered,
    scrollToCentre,
    sleep,
    tapId,
    type Ctx
} from './core.ts';

import type { Locator } from 'e2e';

const loc = (ctx: Ctx, id: string | RegExp): Locator => ctx.screen.getByTestId(id).first();

/** subflows/shared/select-account-by-search: the account picker is open; search `name` and pick it. */
export async function selectAccountBySearch(ctx: Ctx, name: string): Promise<void> {
    const input = byId(ctx.screen, 'AccountPickerBottomSheet.Input');
    await input.fill(name);
    await done(ctx);
    const option = byId(ctx.screen, `AccountPickerBottomSheet.Option.${name}`);
    await expect(option).toBeVisible();
    await tapUntil(option, () => expect(input).toBeHidden({ timeout: 5_000 }));
}

/** subflows/shared/select-account-from-native-picker */
export async function selectAccountFromNativePicker(ctx: Ctx, optionId: string): Promise<void> {
    await ctx.screen.scrollUntilVisible(byId(ctx.screen, optionId), { timeout: 10_000 });
    await tapUntil(byId(ctx.screen, optionId), () => expectNoId(ctx, 'AccountPickerBottomSheet.Input', 5_000));
}

/** subflows/navigation/navigate-to-settings */
export async function navigateToSettings(ctx: Ctx): Promise<void> {
    await openLink(ctx, 'budgie://settings');
    await expectId(ctx, 'SettingsPage.Container', 15_000);
}

/** subflows/navigation/open-settings-card: scroll the settings page to `cardId` (down, else up), tap it, wait for `destinationId`. */
export async function openSettingsCard(ctx: Ctx, cardId: string | RegExp, destinationId: string): Promise<void> {
    const card = loc(ctx, cardId);
    if (!(await card.isVisible())) {
        try {
            await ctx.screen.scrollUntilVisible(card, { direction: 'down', timeout: 15_000 });
        } catch {
            await ctx.screen.scrollUntilVisible(card, { direction: 'up', timeout: 15_000 });
        }
    }
    await expect(card).toBeVisible({ timeout: 3_000 });
    await card.tap();
    await expectId(ctx, destinationId, 8_000);
}

/** subflows/accounts/open-new-account: the create-account type list, from the empty state or the action menu. */
export async function openNewAccount(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    await tapId(ctx, 'TabBar.Home');
    await sleep(600);
    if (await byText(screen, 'No accounts yet').isVisible()) {
        await tapId(ctx, 'AccountsEmptyState.AddAccountButton');
    } else {
        await expectId(ctx, 'ActionButton', 10_000);
        await tapUntil(byId(screen, 'ActionButton'), () => expectId(ctx, 'ActionItem.AddAccount.Label', 5_000));
        await tapId(ctx, 'ActionItem.AddAccount.Label');
    }
    await expectId(ctx, 'CreateAccount.BANK', 10_000);
}

/** subflows/accounts/open-account-details */
export async function openAccountDetails(ctx: Ctx, name: string): Promise<void> {
    await sleep(400);
    // A card in the bottom band sits under the tab bar and the action button: a tap there lands on them.
    await scrollToCentered(ctx, `AccountCard.${name}`);
    await tapUntil(byId(ctx.screen, `AccountCard.${name}`), () => expectId(ctx, 'AccountDetails.Page', 10_000));
}

/** subflows/accounts/open-visible-account-settings: from account details to its edit form. */
export async function openVisibleAccountSettings(ctx: Ctx): Promise<void> {
    await expectId(ctx, 'AccountDetails.Page', 10_000);
    await expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
    await tapUntil(byId(ctx.screen, 'AccountDetails.ActionsButton'), () => expectId(ctx, 'AccountDetails.EditButton', 5_000));
    await tapId(ctx, 'AccountDetails.EditButton');
    await expect(byText(ctx.screen, 'Edit Account')).toBeVisible({ timeout: 10_000 });
}

/** subflows/accounts/open-account-settings */
export async function openAccountSettings(ctx: Ctx, name: string): Promise<void> {
    await openAccountDetails(ctx, name);
    await openVisibleAccountSettings(ctx);
}

/** subflows/accounts/exit-account-details-to-home */
export async function exitAccountDetailsToHome(ctx: Ctx): Promise<void> {
    await tapId(ctx, 'PageHeader.BackButton');
    await expectId(ctx, 'HomePage.TotalBalance', 10_000);
}

/** Waits for the account form's submit button to be enabled and taps it (retrying a tap that does not take). */
async function submitAccountForm(ctx: Ctx, next: () => Promise<void>): Promise<void> {
    const submit = byId(ctx.screen, 'AccountForm.SubmitButton');
    await expect(submit).toBeVisible({ timeout: 3_000 });
    await expect(submit).toBeEnabled({ timeout: 3_000 });
    await tapUntil(submit, next);
}

/** subflows/accounts/update-account-balance: on the edit form, set the balance and save. */
export async function updateAccountBalance(ctx: Ctx, newBalance: string): Promise<void> {
    const amount = byId(ctx.screen, 'CreateAccount.Amount');
    await amount.clear();
    await amount.fill(newBalance);
    await submitAccountForm(ctx, () => expectId(ctx, 'HomePage.TotalBalance', 15_000));
}

/** subflows/accounts/rename-account: on the edit form. */
async function renameAccount(ctx: Ctx, newName: string): Promise<void> {
    await scrollTo(ctx, 'AccountForm.NameInput', 'up');
    const input = byId(ctx.screen, 'AccountForm.NameInput');
    await input.clear();
    await input.fill(newName);
    await tapId(ctx, 'AccountForm.NameInput.Label');
    await expectId(ctx, 'AccountForm.SubmitButton', 3_000);
    await tapId(ctx, 'AccountForm.SubmitButton');
    await expectId(ctx, `AccountCard.${newName}`, 10_000);
}

/** subflows/accounts/set-debt-return-date: on the edit form. */
async function setDebtReturnDate(ctx: Ctx, day: string, label: string | RegExp): Promise<void> {
    await scrollTo(ctx, 'AccountForm.ReturnDate');
    await tapId(ctx, 'AccountForm.ReturnDate');
    await expectId(ctx, `DatePicker.Day.${day}`, 10_000);
    await tapId(ctx, `DatePicker.Day.${day}`);
    await expect(byText(ctx.screen, label)).toBeVisible();
}

/** subflows/accounts/open-archived-accounts */
export async function openArchivedAccounts(ctx: Ctx): Promise<void> {
    await openLink(ctx, 'budgie://settings/archived');
    await expectId(ctx, 'ArchivedAccountsPage.Container', 10_000);
}

/** subflows/accounts/open-inactive-accounts */
async function openInactiveAccounts(ctx: Ctx): Promise<void> {
    await openLink(ctx, 'budgie://settings/inactive');
    await expectId(ctx, 'InactiveAccountsPage.Container', 15_000);
}

/** subflows/accounts/assert-adjustment-transaction */
export async function assertAdjustmentTransaction(ctx: Ctx, delta: string): Promise<void> {
    await expectId(ctx, 'TransactionCard.Badge.Adjustment', 10_000);
    await expectId(ctx, `TransactionCard.AdjustmentAmount.${delta}`);
}

/** subflows/accounts/set-main-currency */
async function setMainCurrency(ctx: Ctx, currency: string): Promise<void> {
    const search = byId(ctx.screen, 'CurrencySelector.SearchInput');
    await navigateToSettings(ctx);
    for (let attempt = 1; ; attempt++) {
        try {
            if (!(await search.isVisible())) {
                await openSettingsCard(ctx, /^SettingsPage\.MainCurrencyCard\..+$/, 'CurrencySelector.SearchInput');
            }
            await expect(search).toBeVisible({ timeout: 3_000 });
            break;
        } catch (cause) {
            if (attempt === 2) {
                throw cause;
            }
        }
    }
    const option = byId(ctx.screen, `AccountForm.CurrencyOption.${currency}`);
    if (!(await option.isVisible())) {
        await search.fill(currency);
    }
    await expect(option).toBeVisible({ timeout: 3_000 });
    await option.tap();
    await expect(search).toBeHidden({ timeout: 3_000 });
    await expectId(ctx, `SettingsPage.MainCurrencyCard.${currency}`, 10_000);
    await tapId(ctx, 'TabBar.Home');
    await expectId(ctx, 'HomePage.TotalBalance', 30_000);
}

/** The account form's currency selector: open it, search `currency`, pick it. */
async function pickAccountCurrency(ctx: Ctx, currency: string, expectSelected = true): Promise<void> {
    const search = byId(ctx.screen, 'CurrencySelector.SearchInput');
    await tapUntil(byId(ctx.screen, 'AccountForm.CurrencySelector'), () => expect(search).toBeVisible({ timeout: 3_000 }));
    await search.clear();
    await search.fill(currency);
    await expectId(ctx, `AccountForm.CurrencyOption.${currency}`, 3_000);
    await tapId(ctx, `AccountForm.CurrencyOption.${currency}`);
    await expect(search).toBeHidden({ timeout: 3_000 });
    if (expectSelected) {
        await expectId(ctx, `AccountForm.SelectedCurrency.${currency}`, 3_000);
    }
}

/** Taps an account type on the create-account list and waits for the form. */
async function chooseAccountType(ctx: Ctx, typeId: string): Promise<void> {
    await expectId(ctx, typeId, 3_000);
    await tapUntil(byId(ctx.screen, typeId), () => expectId(ctx, 'AccountForm.NameInput', 3_000));
}

export interface DebtAccount {
    readonly name: string;
    readonly currency: string;
    readonly currentBalance: string;
    readonly targetBalance: string;
    readonly debtType: 'LENT' | 'BORROW';
    /** The account that funds the opening transfer; omitted, the form shows the manual-opening hint. */
    readonly fundingAccount?: string;
    /** `AccountForm.SelectedOpeningAccount.<id>` suffix of the funding account. */
    readonly fundingAccountId?: string;
}

/** subflows/accounts/create-debt-account */
export async function createDebtAccount(ctx: Ctx, debt: DebtAccount): Promise<void> {
    const { screen } = ctx;
    const title = screen.getByText('Debt Account').first();
    await openNewAccount(ctx);
    await tapId(ctx, 'CreateAccount.DEBT');
    await expectId(ctx, 'AccountForm.NameInput', 3_000);

    const amount = byId(screen, 'CreateAccount.Amount');
    await amount.clear();
    await fillAmount(amount, debt.currentBalance);
    await title.tap();

    await tapFill(ctx, 'AccountForm.NameInput', debt.name);
    await tapId(ctx, 'AccountForm.NameInput.Label');

    await expectId(ctx, 'AccountForm.CurrencySelector', 3_000);
    await pickAccountCurrency(ctx, debt.currency);

    if (debt.debtType === 'LENT') {
        await scrollTo(ctx, 'AccountForm.DebtType.LENT.Selected');
    } else {
        await scrollTo(ctx, 'AccountForm.DebtType.BORROW');
        await tapUntil(byId(screen, 'AccountForm.DebtType.BORROW'), () => expectId(ctx, 'AccountForm.DebtType.BORROW.Selected', 2_000));
    }

    await scrollTo(ctx, 'AccountForm.TargetBalanceInput', 'up');
    const target = byId(screen, 'AccountForm.TargetBalanceInput');
    await target.clear();
    await target.fill(debt.targetBalance);

    await scrollTo(ctx, 'AccountForm.OpeningAccountSelector', 'up');
    if (debt.fundingAccount === undefined || debt.fundingAccount === '') {
        await expectId(ctx, 'AccountForm.ManualOpeningHint');
    } else {
        await title.tap();
        await scrollTo(ctx, 'AccountForm.CurrencySelector', 'up');
        await tapId(ctx, 'AccountForm.OpeningAccountSelector');
        await expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
        await selectAccountBySearch(ctx, debt.fundingAccount);
        await expectId(ctx, `AccountForm.SelectedOpeningAccount.${debt.fundingAccountId ?? debt.fundingAccount}`, 5_000);
    }

    await submitAccountForm(ctx, () => expectId(ctx, 'HomePage.TotalBalance', 15_000));
    await scrollTo(ctx, `AccountCard.${debt.name}`);
}

async function tapFill(ctx: Ctx, testId: string, text: string): Promise<void> {
    const input = byId(ctx.screen, testId);
    await input.tap();
    await input.fill(text);
}

/** subflows/accounts/create-liability-account: `typeId` is the create-account card (`CreateAccount.LOAN`, …). */
export async function createLiabilityAccount(
    ctx: Ctx,
    account: { typeId: string; name: string; currency: string; amount: string }
): Promise<void> {
    await openNewAccount(ctx);
    await chooseAccountType(ctx, account.typeId);
    await tapFill(ctx, 'AccountForm.NameInput', account.name);
    await pickAccountCurrency(ctx, account.currency, false);
    await expectId(ctx, 'CreateAccount.Amount', 3_000);
    await tapFill(ctx, 'CreateAccount.Amount', account.amount);
    await tapId(ctx, 'AccountForm.NameInput.Label');
    await submitAccountForm(ctx, () => expectId(ctx, 'HomePage.TotalBalance', 15_000));
    await expectId(ctx, `AccountCard.${account.name}`, 20_000);
}

/** subflows/accounts/create-crypto-account */
export async function createCryptoAccount(ctx: Ctx, account: { name: string; currency: string; amount: string }): Promise<void> {
    await openNewAccount(ctx);
    await chooseAccountType(ctx, 'CreateAccount.CRYPTO');
    await tapFill(ctx, 'AccountForm.NameInput', account.name);
    await scrollTo(ctx, 'AccountForm.CurrencySelector');
    await pickAccountCurrency(ctx, account.currency);
    const amount = byId(ctx.screen, 'CreateAccount.Amount');
    await amount.tap();
    await amount.clear();
    await amount.fill(account.amount);
    await tapId(ctx, 'AccountForm.NameInput.Label');
    await expectId(ctx, `AccountForm.SelectedCurrency.${account.currency}`, 3_000);
    await submitAccountForm(ctx, () => expectId(ctx, 'HomePage.TotalBalance', 10_000));
}

/** The inactive-accounts page: activate `name` and go back home. */
async function activateInactiveAccount(ctx: Ctx, name: string): Promise<void> {
    await expectId(ctx, `InactiveAccountCard.${name}`, 10_000);
    await tapId(ctx, `InactiveAccountCard.ActivateButton.${name}`);
    await expectNoId(ctx, `InactiveAccountCard.${name}`, 10_000);
    await tapId(ctx, 'TabBar.Home');
}

/** On the edit form: scroll to `rowId`, tap it, save. */
async function toggleAndSave(ctx: Ctx, rowId: string): Promise<void> {
    await scrollToCentre(ctx, rowId);
    await tapId(ctx, rowId);
    await tapId(ctx, 'AccountForm.SubmitButton');
}

/** On the edit form: archive the account (no confirmation dialog). */
async function archiveFromSettings(ctx: Ctx): Promise<void> {
    await scrollToCentre(ctx, 'AccountDetails.ArchiveButton');
    await tapId(ctx, 'AccountDetails.ArchiveButton');
}

export interface DebtExercise {
    readonly name: string;
    readonly updatedName: string;
    readonly returnDay: string;
    readonly returnDateLabel: string | RegExp;
    readonly increaseTo: string;
    readonly increaseOutstanding: string;
    readonly decreaseTo: string;
    readonly decreaseOutstanding: string;
    readonly currency: string;
    readonly netWorthWhenIncluded: string;
}

/** subflows/accounts/exercise-debt-account */
export async function exerciseDebtAccount(ctx: Ctx, d: DebtExercise): Promise<void> {
    const { screen } = ctx;
    await openAccountDetails(ctx, d.name);
    await openVisibleAccountSettings(ctx);
    await setDebtReturnDate(ctx, d.returnDay, d.returnDateLabel);
    await renameAccount(ctx, d.updatedName);
    await openAccountSettings(ctx, d.updatedName);
    await expect(byText(screen, d.returnDateLabel)).toBeVisible();

    await updateAccountBalance(ctx, d.increaseTo);
    await openAccountDetails(ctx, d.updatedName);
    await expectId(ctx, `DebtAccountBalance.OutstandingAmount.${d.increaseOutstanding}`);
    await expectId(ctx, `DebtAccountBalance.PaidAmount.${d.increaseTo}`);
    await expectNoId(ctx, 'TransactionCard.Badge.Adjustment');

    await openVisibleAccountSettings(ctx);
    await updateAccountBalance(ctx, d.decreaseTo);
    await openAccountDetails(ctx, d.updatedName);
    await expectId(ctx, `DebtAccountBalance.OutstandingAmount.${d.decreaseOutstanding}`);
    await expectId(ctx, `DebtAccountBalance.PaidAmount.${d.decreaseTo}`);
    await expectNoId(ctx, 'TransactionCard.Badge.Adjustment');

    await exitAccountDetailsToHome(ctx);
    await setMainCurrency(ctx, d.currency);
    await expectId(ctx, 'HomePage.NetWorthValue.0');
    await ctx.screen.scrollUntilVisible(byId(screen, `AccountCard.${d.updatedName}`), { timeout: 8_000 });

    await openAccountSettings(ctx, d.updatedName);
    await toggleAndSave(ctx, 'AccountForm.ActiveRow');
    await expectId(ctx, 'HomePage.NetWorthValue.0', 10_000);
    await expectNoId(ctx, `AccountCard.${d.updatedName}`);

    await openInactiveAccounts(ctx);
    await activateInactiveAccount(ctx, d.updatedName);
    await expectId(ctx, 'HomePage.NetWorthValue.0', 10_000);
    await ctx.screen.scrollUntilVisible(byId(screen, `AccountCard.${d.updatedName}`), { timeout: 8_000 });

    await openAccountSettings(ctx, d.updatedName);
    await toggleAndSave(ctx, 'AccountForm.IncludeInNetWorthTitle');
    await expectId(ctx, `HomePage.NetWorthValue.${d.netWorthWhenIncluded}`, 10_000);

    await openAccountSettings(ctx, d.updatedName);
    await toggleAndSave(ctx, 'AccountForm.IncludeInNetWorthTitle');
    await expectId(ctx, 'HomePage.NetWorthValue.0', 10_000);

    await openAccountSettings(ctx, d.updatedName);
    await archiveFromSettings(ctx);
    await expectId(ctx, 'HomePage.NetWorthValue.0', 10_000);
    await expectNoId(ctx, `AccountCard.${d.updatedName}`);

    await openArchivedAccounts(ctx);
    await expectId(ctx, `ArchivedAccountCard.${d.updatedName}`);
}

export interface LiabilityExercise {
    readonly name: string;
    readonly updatedName: string;
    readonly initialAmount: string;
    readonly increaseTo: string;
    readonly increaseDelta: string;
    readonly decreaseTo: string;
    readonly decreaseDelta: string;
    readonly currency: string;
}

/** subflows/accounts/exercise-liability-account */
export async function exerciseLiabilityAccount(ctx: Ctx, l: LiabilityExercise): Promise<void> {
    const { screen } = ctx;
    await openAccountDetails(ctx, l.name);
    await assertAdjustmentTransaction(ctx, l.initialAmount);

    await openVisibleAccountSettings(ctx);
    await renameAccount(ctx, l.updatedName);
    await openAccountDetails(ctx, l.updatedName);
    await expectId(ctx, `TransactionCard.AdjustmentAmount.${l.initialAmount}`, 10_000);

    await openVisibleAccountSettings(ctx);
    await updateAccountBalance(ctx, l.increaseTo);
    await openAccountDetails(ctx, l.updatedName);
    await assertAdjustmentTransaction(ctx, l.increaseDelta);

    await openVisibleAccountSettings(ctx);
    await updateAccountBalance(ctx, l.decreaseTo);
    await openAccountDetails(ctx, l.updatedName);
    await assertAdjustmentTransaction(ctx, l.increaseDelta);
    await expectId(ctx, `TransactionCard.AdjustmentAmount.${l.decreaseDelta}`);

    // Once net worth reads `netWorth`, flip one switch in the account's settings and save.
    const toggleSetting = async (netWorth: string, field: string): Promise<void> => {
        await expectId(ctx, `HomePage.NetWorthValue.${netWorth}`, 10_000);
        await ctx.screen.scrollUntilVisible(byId(screen, `AccountCard.${l.updatedName}`), { timeout: 8_000 });
        await openAccountSettings(ctx, l.updatedName);
        await toggleAndSave(ctx, field);
    };

    await exitAccountDetailsToHome(ctx);
    await setMainCurrency(ctx, l.currency);
    await toggleSetting(l.decreaseTo, 'AccountForm.ActiveRow');
    await expectId(ctx, `HomePage.NetWorthValue.${l.decreaseTo}`, 10_000);
    await sleep(400);
    await expectNoId(ctx, `AccountCard.${l.updatedName}`);

    await openInactiveAccounts(ctx);
    await activateInactiveAccount(ctx, l.updatedName);
    await toggleSetting(l.decreaseTo, 'AccountForm.IncludeInNetWorthTitle');
    await toggleSetting('0', 'AccountForm.IncludeInNetWorthTitle');
    await expectId(ctx, `HomePage.NetWorthValue.${l.decreaseTo}`, 10_000);

    await openAccountSettings(ctx, l.updatedName);
    await archiveFromSettings(ctx);
    await expectId(ctx, 'HomePage.NetWorthValue.0', 10_000);
    await expectNoId(ctx, `AccountCard.${l.updatedName}`);

    await openArchivedAccounts(ctx);
    await expectId(ctx, `ArchivedAccountCard.${l.updatedName}`, 10_000);
}

/**
 * `swipe: { from: { id }, direction: DOWN }` on the account form: the finger drags down inside the form, which
 * dismisses the keyboard. agent-device rejects a drag that would enter the keyboard ("does not fit inside the
 * viewport"), so the drag stays in the top part of the form; if even that is rejected, the keyboard is dismissed directly.
 */
export async function swipeDownFromCentre(ctx: Ctx, testId: string): Promise<void> {
    const box = await byId(ctx.screen, testId).boundingBox();
    if (box === null) {
        throw new Error(`${testId} has no bounds`);
    }
    const x = box.x + box.width / 2;
    const y = box.y + 80;
    try {
        await ctx.screen.swipe({ from: { x, y }, to: { x, y: y + 160 }, duration: 300 });
    } catch (cause) {
        console.log(`[form] drag rejected (${(cause as Error).message.split('\n')[0]}); dismissing the keyboard instead`);
        try {
            await ctx.device.dismissKeyboard();
        } catch (again) {
            console.log(`[form] keyboard dismissal failed: ${(again as Error).message.split('\n')[0]}`);
        }
    }
    await sleep(300);
}

/** On the deposit form: rate and maturity day (the 37 flow's create and edit steps). */
export async function setDepositTerms(ctx: Ctx, rate: string, maturityDay: string): Promise<void> {
    await scrollTo(ctx, 'AccountForm.InterestRateInput');
    const input = byId(ctx.screen, 'AccountForm.InterestRateInput');
    await input.tap();
    await input.clear();
    await input.fill(rate);
    await swipeDownFromCentre(ctx, 'AccountForm.ScrollView');
    await scrollTo(ctx, 'AccountForm.MaturityDate');
    await tapId(ctx, 'AccountForm.MaturityDate');
    await expectId(ctx, `DatePicker.Day.${maturityDay}`, 10_000);
    await tapId(ctx, `DatePicker.Day.${maturityDay}`);
}

/** Taps the account form's submit button once it is enabled, retrying a tap that does not take, until `waitId` shows. */
export async function submitAccountFormUntil(ctx: Ctx, waitId: string, timeout = 15_000): Promise<void> {
    await submitAccountForm(ctx, () => expectId(ctx, waitId, timeout));
}

/**
 * Types an amount into a money field. The field swallows a lone `0` (it stays empty and shows its `0` placeholder),
 * which fails `fill`'s read-back; that end state is the same as typing `0`, so it is accepted.
 */
async function fillAmount(field: Locator, value: string): Promise<void> {
    try {
        await field.fill(value);
    } catch (cause) {
        if (!/^0+$/.test(value)) {
            throw cause;
        }
        const shown = (await field.inputValue()).trim();
        if (shown !== '' && !/^0+([.,]0*)?$/.test(shown)) {
            throw cause;
        }
    }
}
