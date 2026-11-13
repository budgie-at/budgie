import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mustExec } from '@mobile-ci/e2e-simlock/exec';
import { expect } from 'e2e';

import * as a from '../budgie/accounts.ts';
import * as b from '../budgie/core.ts';
import { BUNDLE_ID } from '../budgie/fixtures.ts';
import * as i from '../budgie/imports.ts';
import * as m from '../budgie/misc.ts';
import * as t from '../budgie/transactions.ts';

import * as st from './steps.ts';

import type { Cell } from './plan.ts';
import type { Media, SceneContext } from './session.ts';
import type { Locator } from 'e2e';

type Ctx = b.Ctx;

/**
 * A driven capture scene: the walk from a freshly launched, seeded app to the
 * screen the capture shows. One per former capture flow
 * (`tests/app-tests/flows/{media,store,social}`), named after it.
 */
export interface Scene {
    readonly run: (ctx: Ctx, scene: SceneContext) => Promise<void>;
    /** Part of the media smoke (`media-smoke.yml`) unless false: the scene needs the AI build or credentials. */
    readonly smoke?: boolean;
    /** The capture scene the smoke seeds it as (its seed overlay), when a capture config names it differently. */
    readonly seed?: string;
    /** Installs the scene's own device state in place of the showcase seed (the app is launched after). */
    readonly prepare?: (media: Media, cell: Cell) => Promise<void>;
}

const rx =
    (pattern: RegExp) =>
    (ctx: Ctx): Locator =>
        ctx.screen.getByTestId(pattern);
const transactionCard = rx(/^TransactionCard\.Label\..+$/);
const debtOutstanding = rx(/^DebtAccountCardSummary\.OutstandingAmount\..+$/);
const categoryStatistics = rx(/^CategoryStatisticsCard\.[^.]+$/);
const categoryCard = rx(/^CategoryCard\.[^.]+$/);
const pickerCategory = rx(/^CategoryPickerBottomSheet\.Card\..+\.Label$/);

const viewports = new Map<string, { width: number; height: number }>();

/** The device's screen in points, read once per device off a screenshot. */
async function viewport(ctx: Ctx): Promise<{ width: number; height: number }> {
    const { deviceId, client } = ctx.device.unstable_raw;
    let size = viewports.get(deviceId);
    if (size === undefined) {
        const shot = await client.capture.screenshot({});
        const width = b.isIos(ctx) ? shot.logicalWidth : shot.width;
        const height = b.isIos(ctx) ? shot.logicalHeight : shot.height;
        if (width === undefined || height === undefined) {
            throw new Error('the screenshot reported no viewport size');
        }
        size = { width, height };
        viewports.set(deviceId, size);
    }
    return size;
}

/** `centerElement`: drag the node to the middle of the screen, slowly enough that nothing flings. */
async function center(ctx: Ctx, target: Locator): Promise<void> {
    const { width, height } = await viewport(ctx);
    for (let attempt = 0; attempt < 3; attempt++) {
        const box = await target.boundingBox();
        if (box === null) return;
        const offset = box.y + box.height / 2 - height / 2;
        if (Math.abs(offset) < height * 0.05) return;
        const half = Math.max(Math.min(offset / 2, height * 0.3), -height * 0.3);
        await ctx.screen.swipe({
            from: { x: width * 0.2, y: height / 2 + half },
            to: { x: width * 0.2, y: height / 2 - half },
            duration: 900
        });
        await b.sleep(700);
    }
}

/**
 * `scrollUntilVisible: direction: DOWN`, optionally centred. Pages by slow
 * swipes down the screen's left third, clear of horizontal carousels (the
 * home screen's asset mix swallows a centred swipe), each followed by a
 * visibility check, so a swipe that lands mid-launch only costs a step.
 */
async function scrollDown(ctx: Ctx, target: Locator, centred = false): Promise<void> {
    const { width, height } = await viewport(ctx);
    for (let page = 0; !(await target.isVisible()); page++) {
        if (page === 12) throw new Error(`not found after ${page} pages: ${String(target)}`);
        await ctx.screen.swipe({ from: { x: width * 0.2, y: height * 0.7 }, to: { x: width * 0.2, y: height * 0.35 }, duration: 600 });
        await b.sleep(500);
    }
    if (centred) await center(ctx, target);
}

/** subflows/navigation/open-deep-link, then the screen's first element. */
async function open(ctx: Ctx, link: string, testId: string | Locator, timeout = 15_000): Promise<void> {
    await b.openLink(ctx, link);
    await expect(typeof testId === 'string' ? b.byId(ctx.screen, testId) : testId.first()).toBeVisible({ timeout });
}

const home = (ctx: Ctx) => open(ctx, 'budgie://', 'HomePage.TotalBalance');

async function homeToDebtCard(ctx: Ctx): Promise<void> {
    await home(ctx);
    await scrollDown(ctx, debtOutstanding(ctx).first(), true);
}

async function keypadTransfer(ctx: Ctx, link: string): Promise<void> {
    await open(ctx, link, 'TransactionKeypad.Digit.1');
    for (const digit of '250') await b.tapId(ctx, `TransactionKeypad.Digit.${digit}`);
}

async function openInboxList(ctx: Ctx): Promise<void> {
    await t.navigateToTransactions(ctx);
    await b.expectId(ctx, 'UncategorizedTransactionsPill.Button', 15_000);
    await b.tapId(ctx, 'UncategorizedTransactionsPill.Button');
    await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 10_000);
    await b.tapId(ctx, 'CategorizeInboxPage.ShowListButton');
}

/** The transactions list, its first card long-pressed for the context menu. */
async function longPressFirstCard(ctx: Ctx): Promise<void> {
    await t.navigateToTransactions(ctx);
    await expect(transactionCard(ctx).first()).toBeVisible({ timeout: 15_000 });
    await transactionCard(ctx).first().longPress();
}

async function openFirstCategory(ctx: Ctx): Promise<void> {
    await open(ctx, 'budgie://settings/categories', categoryCard(ctx));
    await categoryCard(ctx).first().tap();
}

/** The category picker's search, then its first match: a rule suggestion follows on an edited expense. */
async function pickSearchedCategory(ctx: Ctx, search: string): Promise<void> {
    await b.tapId(ctx, 'TransactionForm.CategorySelector');
    await b.expectId(ctx, 'CategoryPickerBottomSheet.Input', 10_000);
    await b.fillId(ctx, 'CategoryPickerBottomSheet.Input', search);
    await expect(pickerCategory(ctx).first()).toBeVisible({ timeout: 10_000 });
    await pickerCategory(ctx).first().tap();
}

async function openDateFilter(ctx: Ctx): Promise<void> {
    await t.navigateToTransactions(ctx);
    await m.revealChip(ctx, 'TransactionFilters.TypeChip', 'TransactionFilters.DateChip', 'right');
    await b.tapId(ctx, 'TransactionFilters.DateChip');
    await b.expectId(ctx, 'TransactionFilters.DatePeriod.LAST_MONTH', 10_000);
    await b.tapId(ctx, 'TransactionFilters.DatePeriod.LAST_MONTH');
}

async function openRecurringCalendar(ctx: Ctx): Promise<void> {
    await t.navigateToTransactions(ctx);
    await b.tapId(ctx, 'TransactionsPage.Tab.Recurring');
    await b.tapId(ctx, 'RecurringPane.CalendarModeButton');
    await b.expectId(ctx, 'RecurringCalendar.Container', 15_000);
}

/** subflows/transactions/open-action-menu, then the AI item once the on-device model is ready. */
async function openVoiceEntry(ctx: Ctx, modelTimeout: number): Promise<void> {
    await home(ctx);
    await b.expectId(ctx, 'ActionButton', 120_000);
    await t.openActionMenu(ctx);
    const ai = b.byId(ctx.screen, 'ActionItem.AiButton');
    await expect(ai).toBeVisible({ timeout: modelTimeout });
    await expect(ai).toBeEnabled({ timeout: modelTimeout });
    await ai.tap();
    await b.expectId(ctx, 'VoiceInputOverlay.RecordButton', 15_000);
}

async function typeMerchant(ctx: Ctx, title: string): Promise<void> {
    await open(ctx, 'budgie://create-transaction/expense', 'TransactionForm.MerchantInput');
    await b.byId(ctx.screen, 'TransactionForm.MerchantInput').pressSequentially(title);
}

/** The new-account list, scrolled to a statement bank, its picker opened on `file`. */
async function statementImport(ctx: Ctx, bank: string, file: string, rowId: string): Promise<void> {
    await home(ctx);
    await a.openNewAccount(ctx);
    await scrollDown(ctx, b.byId(ctx.screen, `CreateAccount.${bank}`));
    await b.sleep(600);
    await b.tapId(ctx, `CreateAccount.${bank}`);
    await b.expectId(ctx, 'CreateFileBankAccount.SelectFileButton', 10_000);
    await b.tapUntil(ctx, 'CreateFileBankAccount.SelectFileButton', () =>
        expect(b.byId(ctx.screen, 'DOC.browsingModeTabBar')).toBeVisible({ timeout: 5_000 })
    );
    await i.selectFileFromAppProvider(ctx, file);
    await b.expectId(ctx, rowId, 5_000);
}

/**
 * The PIN keypad, one digit at a time. The first tap on a freshly shown
 * keypad is sometimes swallowed, so the first digit is tapped until the
 * delete key (shown once a digit is in, whatever the locale) appears; the
 * rest get a pause each, so none lands before the keypad took the last.
 */
async function enterPin(ctx: Ctx, pin: string): Promise<void> {
    const [first, ...rest] = pin;
    const deleteKey = b.byId(ctx.screen, 'PinPage.DeleteButton');
    for (let attempt = 0; ; attempt++) {
        await b.tapId(ctx, `PinPage.Digit.${first}`);
        try {
            await expect(deleteKey).toBeVisible({ timeout: 2_000 });
            break;
        } catch (error) {
            if (attempt === 2) throw error;
        }
    }
    for (const digit of rest) {
        await b.sleep(300);
        await b.tapId(ctx, `PinPage.Digit.${digit}`);
    }
}

/**
 * install-apple-pay-shortcuts-guide-fixtures.sh: the guide database live and
 * the pending Apple Pay captures the Shortcuts automation would have queued,
 * as App Intents' pending-invocations defaults.
 */
async function applePayGuide(media: Media): Promise<void> {
    const fixtures = fileURLToPath(new URL('../../../tests/app-tests/fixtures/', import.meta.url));
    await media.installDatabase(readFileSync(join(fixtures, 'apple-pay-shortcuts-guide.db')));
    const invocations = readFileSync(join(fixtures, 'apple-pay-shortcuts-guide-invocations.json')).toString('hex');
    await media.writeAppDefaults('dev.expo.appintents.invocations.pending', '-data', invocations);
}

/** flows/setup/capture-apple-pay-shortcuts-settings: the Apple Pay capture card, centred on the settings page. */
async function applePayCard(ctx: Ctx): Promise<void> {
    await open(ctx, 'budgie://settings?anchor=general', 'SettingsPage.Container');
    await scrollDown(ctx, b.byId(ctx.screen, 'SettingsPage.ApplePayCaptureCard'), true);
    await b.expectId(ctx, 'SettingsPage.ApplePayCaptureCard');
}

async function applePaySettings(ctx: Ctx): Promise<void> {
    await applePayCard(ctx);
    await b.tapId(ctx, 'SettingsPage.ApplePayCaptureCard');
    await b.expectId(ctx, 'ApplePayCaptureSettings.Container', 10_000);
}

async function installmentPlan(ctx: Ctx): Promise<void> {
    await st.createInstallmentPlan(ctx, 2600, 'InstallmentPlanScheduleSummary.Progress.2_3');
    await expect(ctx.screen.getByText(/^(Plan created|Plan erstellt|Plan créé|Plan creado|План створено)$/).first()).toBeHidden({
        timeout: 15_000
    });
}

export const SCENES: Readonly<Record<string, Scene>> = {
    'account-management-3': {
        run: async ctx => {
            await home(ctx);
            await a.openNewAccount(ctx);
            await b.tapId(ctx, 'CreateAccount.DEPOSIT');
            await b.expectId(ctx, 'AccountForm.SubmitButton', 15_000);
        }
    },
    'account-transfers-1': { run: ctx => keypadTransfer(ctx, 'budgie://create-transaction/transfer?accountId=1&toAccountId=2') },
    'account-transfers-2': { run: ctx => keypadTransfer(ctx, 'budgie://create-transaction/transfer?accountId=1&toAccountId=5') },
    'ai-auto-categorization-1': {
        run: async ctx => {
            await typeMerchant(ctx, process.env.MERCHANT_TITLE ?? 'Whole Foods Market');
            await b.byId(ctx.screen, 'TransactionForm.MerchantInput').press('Enter');
            await b.expectId(ctx, 'SuggestionPill.PatternCategory.0', 15_000);
        }
    },
    'ai-category-translation-1': {
        run: async ctx => {
            await open(ctx, 'budgie://settings/categories', 'CategoryCard.Сільпо');
            await b.tapId(ctx, 'CategoryCard.Сільпо');
            await b.expectId(ctx, 'CategoryForm.Input', 15_000);
        }
    },
    'ai-tag-suggestions-1': {
        run: async ctx => {
            await open(ctx, 'budgie://create-transaction/expense', 'TransactionForm.CategorySelector');
            await pickSearchedCategory(ctx, process.env.CATEGORY_SEARCH ?? 'Groceries');
            await b.expectId(ctx, 'SuggestionPill.PatternTag.0', 15_000);
        }
    },
    'ai-transaction-suggestions-1': {
        run: async ctx => {
            await open(ctx, 'budgie://create-transaction/expense', 'TransactionForm.AmountInput');
            await b.expectId(ctx, 'SuggestionPill.PatternCategory.0', 15_000);
        }
    },
    'bank-fee-tracking-1': {
        run: async ctx => {
            await open(ctx, 'budgie://transactions/2300/transfer', 'TransactionInfo.Page');
            await scrollDown(ctx, b.byId(ctx.screen, 'TransactionInfo.Row.Fee'), true);
            await b.expectId(ctx, 'TransactionInfo.Row.Fee', 5_000);
            await b.tapId(ctx, 'TransactionInfo.Row.Fee');
            await b.expectId(ctx, 'SplitEntryRow.Amount.0', 10_000);
        }
    },
    'bank-resync-window-1': {
        run: async ctx => {
            await open(ctx, 'budgie://account/12/update', 'AccountSyncCard.ResyncButton');
            await b.tapId(ctx, 'AccountSyncCard.ResyncButton');
            await b.expectId(ctx, 'ResyncWindowPicker.Option.7', 10_000);
            await b.expectId(ctx, 'ResyncWindowPicker.Option.all', 5_000);
        }
    },
    'budget-planning-2': {
        run: async ctx => {
            await open(ctx, 'budgie://budget', 'BudgetDetails.SpentLabel');
            await scrollDown(ctx, rx(/^BudgetDetails\.CategoryRow\.[0-9]+$/)(ctx).first());
        }
    },
    'bulk-categorize-transactions-1': {
        run: async ctx => {
            await t.navigateToTransactions(ctx);
            await b.expectId(ctx, 'UncategorizedTransactionsPill.Button', 15_000);
            await b.tapId(ctx, 'UncategorizedTransactionsPill.Button');
            await b.expectId(ctx, 'CategorizeInboxAcceptAllButton.Button', 10_000);
        }
    },
    'bulk-categorize-transactions-2': {
        run: async ctx => {
            await open(ctx, 'budgie://analytics', 'AnalyticsPage.Tab.Tags');
            await b.tapId(ctx, 'AnalyticsPage.Tab.Tags');
            await scrollDown(ctx, b.byId(ctx.screen, 'TagStatisticsCard.Untagged'));
            await b.sleep(600);
            await b.tapId(ctx, 'TagStatisticsCard.Untagged');
            await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 10_000);
        }
    },
    'categorization-rules-2': {
        run: async ctx => {
            await openInboxList(ctx);
            await expect(transactionCard(ctx).first()).toBeVisible({ timeout: 10_000 });
            await transactionCard(ctx).first().tap();
            await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
            await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
            await b.expectId(ctx, 'TransactionForm.CategorySelector', 10_000);
            await b.tapId(ctx, 'TransactionForm.CategorySelector');
            await expect(pickerCategory(ctx).first()).toBeVisible({ timeout: 10_000 });
            await pickerCategory(ctx).first().tap();
            await b.expectId(ctx, 'SuggestRule.Card', 15_000);
        }
    },
    'convert-to-refund-1': { run: ctx => st.openConvertToRefundPicker(ctx, 2200, 'ConvertToRefund.CandidateRow.157') },
    'convert-to-refund-2': {
        run: async ctx => {
            await st.openConvertToRefundPicker(ctx, 2200, 'ConvertToRefund.CandidateRow.157');
            await b.tapId(ctx, 'ConvertToRefund.CandidateRow.157');
            await expect(b.byId(ctx.screen, 'ConvertToRefund.DoneButton')).toBeEnabled({ timeout: 5_000 });
        }
    },
    'convert-to-transfer-1': {
        run: async ctx => {
            await longPressFirstCard(ctx);
            await b.expectId(ctx, 'TransactionContextMenu.ConvertToTransferButton');
            await b.expectId(ctx, 'TransactionContextMenu.StartDepositButton');
            await b.tapId(ctx, 'TransactionContextMenu.ConvertToTransferButton');
            await b.expectId(ctx, 'ConvertToTransfer.Page', 10_000);
            await b.tapId(ctx, 'TransferForm.ToAccount');
            await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
        }
    },
    'csv-import-2': {
        run: async (ctx, { container }) => {
            await open(
                ctx,
                `budgie://import-csv?fileUri=file://${container}/Documents/E2EFixtures/e2e-budgie-import.csv`,
                'ImportPresetPickerSelector.Toggle'
            );
            await b.tapId(ctx, 'ImportPresetPickerSelector.Toggle');
            await b.tapId(ctx, 'ImportScreen.PresetChip.Budgie');
            await b.expectId(ctx, 'CsvPage.StartImportButton', 15_000);
        }
    },
    'custom-categories-2': {
        run: async ctx => {
            await openFirstCategory(ctx);
            await b.expectId(ctx, 'CategoryForm.Input', 10_000);
        }
    },
    'custom-categories-3': {
        run: async ctx => {
            await openFirstCategory(ctx);
            await b.expectId(ctx, 'CategoryForm.Delete', 10_000);
            await b.tapId(ctx, 'CategoryForm.Delete');
            await b.expectId(ctx, 'CategoryPickerBottomSheet.Input', 10_000);
        }
    },
    'date-filter-presets-1': { run: openDateFilter },
    'date-filter-presets-2': {
        run: async ctx => {
            await openDateFilter(ctx);
            await b.tapId(ctx, 'TransactionFilters.DateApplyButton');
            await b.expectId(ctx, 'TransactionFilters.DateChipActive', 10_000);
            await expect(transactionCard(ctx).first()).toBeVisible({ timeout: 10_000 });
        }
    },
    'debt-tracking-1': { run: homeToDebtCard },
    'debt-tracking-3': {
        run: async ctx => {
            await open(ctx, 'budgie://transactions/202/income', 'TransactionInfo.Page');
            await scrollDown(ctx, b.byId(ctx.screen, 'TransactionInfo.ConvertButton'), true);
            await b.sleep(600);
            await b.tapId(ctx, 'TransactionInfo.ConvertButton');
            await b.tapId(ctx, 'TransactionActionsMenu.AttachDebtSettlementButton');
            await b.expectId(ctx, 'AccountPickerBottomSheet.Input', 10_000);
        }
    },
    'deposit-tracking-2': {
        run: async ctx => {
            await open(ctx, 'budgie://account/8/details', 'AccountDetails.ActionsButton');
            await b.tapId(ctx, 'AccountDetails.ActionsButton');
            await b.expectId(ctx, 'AccountDetails.CloseDepositButton', 5_000);
        }
    },
    'erste-bank-pdf-import-1': {
        run: ctx => statementImport(ctx, 'ERSTE', 'erste-statement-008, pdf', 'SyncAccountSelection.Row.Erste_EUR')
    },
    'installment-tracking-1': { run: ctx => st.openConvertToInstallment(ctx, 2600) },
    'installment-tracking-2': { run: installmentPlan },
    'installment-tracking-3': {
        run: async ctx => {
            await installmentPlan(ctx);
            await homeToDebtCard(ctx);
        }
    },
    'mcc-auto-category-2': {
        run: async ctx => {
            await open(ctx, 'budgie://transactions/9001/expense/edit', 'TransactionForm.CategorySelector');
            await pickSearchedCategory(ctx, 'restaurants');
            await b.expectId(ctx, 'SuggestRule.Card', 15_000);
        }
    },
    'multi-language-app-1': {
        run: async ctx => {
            const card = rx(/^SettingsPage\.LanguageCard\..+$/);
            await open(ctx, 'budgie://settings?anchor=general', card(ctx));
            await a.openSettingsCard(ctx, /^SettingsPage\.LanguageCard\..+$/, 'LanguageSelector.Option.en');
        }
    },
    'net-worth-tracker-2': { run: homeToDebtCard },
    'no-bank-login-budget-app-1': {
        run: async ctx => {
            await home(ctx);
            await a.openNewAccount(ctx);
            await b.tapId(ctx, 'CreateAccount.MONOBANK');
            await b.expectId(ctx, 'CreateMonobankAccount.ScrollView', 15_000);
        }
    },
    'pin-app-lock-1': {
        run: async ctx => {
            await open(ctx, 'budgie://', 'PinPage.Container');
            await enterPin(ctx, '42');
        }
    },
    'privatbank-import-1': {
        run: async ctx => {
            await statementImport(ctx, 'PRIVATBANK', 'privatbank-statement-001, xlsx', 'SyncAccountSelection.Row.Privatbank_1234');
            await b.expectId(ctx, 'SyncAccountSelection.ToggleAll', 5_000);
        }
    },
    'privatbank-import-2': {
        run: async ctx => {
            await statementImport(ctx, 'PRIVATBANK', 'privatbank-statement-001, xlsx', 'SyncAccountSelection.Row.Privatbank_1234');
            await b.tapId(ctx, 'SyncAccountSelection.Row.Privatbank_1234');
            await b.expectId(ctx, 'SyncAccountSelection.ToggleAll', 3_000);
        }
    },
    'recurring-payments-calendar-1': { run: openRecurringCalendar },
    'recurring-payments-calendar-2': {
        run: async ctx => {
            await openRecurringCalendar(ctx);
            await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.15');
            await expect(rx(/^RecurringCalendar\.SelectedDayHeader\..+$/)(ctx).first()).toBeVisible({ timeout: 10_000 });
            await b.expectNoId(ctx, 'RecurringCalendar.SelectedDayEmptyState', 1_000);
        }
    },
    'runway-3': {
        run: async ctx => {
            await open(ctx, 'budgie://analytics?tab=runway', rx(/^RunwayVerdict\.Figure\..+$/)(ctx));
            await scrollDown(ctx, b.byId(ctx.screen, 'RunwayDrivers'), true);
        }
    },
    'spending-analytics-2': {
        run: async ctx => {
            await open(ctx, 'budgie://analytics', categoryStatistics(ctx));
            const third = categoryStatistics(ctx).nth(2);
            await scrollDown(ctx, third, true);
            await b.sleep(600);
            await third.tap();
            await expect(transactionCard(ctx).first()).toBeVisible({ timeout: 15_000 });
        }
    },
    'split-transactions-1': { run: ctx => st.openSplitEntries(ctx, 2400, 'SplitEntryRow.Amount.2') },
    'split-transactions-2': {
        run: async ctx => {
            await st.openSplitEntries(ctx, 2400, 'SplitEntryRow.Amount.2');
            await b.tapId(ctx, 'SplitEntryRow.Delete.2');
            await b.expectNoId(ctx, 'SplitEntryRow.Amount.2', 5_000);
        }
    },
    'statistics-tags-tab-1': {
        run: async ctx => {
            await open(ctx, 'budgie://analytics', 'AnalyticsPage.Tab.Tags');
            await b.tapId(ctx, 'AnalyticsPage.Tab.Tags');
            await expect(rx(/^TagStatisticsCard\..+$/)(ctx).first()).toBeVisible({ timeout: 10_000 });
        }
    },
    'transaction-long-press-menu-1': {
        run: async ctx => {
            await longPressFirstCard(ctx);
            await b.expectId(ctx, 'TransactionContextMenu.EditButton', 10_000);
        }
    },
    'transaction-tags-1': {
        run: async ctx => {
            await open(ctx, 'budgie://create-transaction/expense', 'TransactionForm.TagsSelector');
            await b.tapId(ctx, 'TransactionForm.TagsSelector');
            await b.expectId(ctx, 'TagPickerBottomSheet.Input', 10_000);
        }
    },
    'transfer-pair-detection-2': {
        run: async ctx => {
            await open(ctx, 'budgie://transactions/2110/transfer', 'TransactionInfo.Row.Consolidation');
            await b.tapId(ctx, 'TransactionInfo.Row.Consolidation');
            await b.expectId(ctx, 'ConsolidationSourceModal.Row.1', 10_000);
        }
    },
    'uncategorized-transactions-2': {
        run: async ctx => {
            await openInboxList(ctx);
            await b.expectId(ctx, 'PageHeader.BackButton', 10_000);
        }
    },
    // The AI build only (ios-e2e-ai-build.yml): the on-device model downloads before the AI item enables.
    'voice-transaction-entry-1': { smoke: false, run: ctx => openVoiceEntry(ctx, 600_000) },

    // Store screenshots (store-screenshots.config.json) and the landing page's App Store preview clip.
    '03-analytics': {
        run: async ctx => {
            await open(ctx, 'budgie://analytics', 'TransactionFilters.DateChipActive');
            await b.tapId(ctx, 'TransactionFilters.DateChipActive');
            await b.expectId(ctx, 'TransactionFilters.DatePeriod.LAST_MONTH', 10_000);
            await b.tapId(ctx, 'TransactionFilters.DatePeriod.LAST_MONTH');
            await b.tapId(ctx, 'TransactionFilters.DateApplyButton');
            await expect(categoryStatistics(ctx).first()).toBeVisible({ timeout: 15_000 });
        }
    },
    '05-add-expense': {
        run: async ctx => {
            await open(ctx, 'budgie://create-transaction/expense', 'SuggestionPill.PatternCategory.0');
            await b.tapId(ctx, 'SuggestionPill.PatternCategory.0');
            await b.expectNoId(ctx, 'SuggestionPill.PatternCategory.0', 10_000);
        }
    },
    '07-settings': {
        run: async ctx => {
            await open(ctx, 'budgie://pin-setup?mode=CREATE', 'PinPage.Container');
            for (let round = 0; round < 2; round++) {
                await enterPin(ctx, '1234');
                await b.sleep(800);
            }
            await b.expectId(ctx, 'PinScreen.ForgotPinButton', 90_000);
            await enterPin(ctx, '1234');
            // The unlock can replay the pin-setup link it locked over; back out of that second setup to the tabs.
            const tabs = b.byId(ctx.screen, 'TabBar.Settings');
            await expect(tabs.or(b.byId(ctx.screen, 'PageHeader.BackButton')).first()).toBeVisible({ timeout: 15_000 });
            if (!(await tabs.isVisible())) await b.tapId(ctx, 'PageHeader.BackButton');
            await expect(tabs).toBeVisible({ timeout: 15_000 });
            await tabs.tap();
            await b.expectId(ctx, 'SettingsPage.DataEncryption.State.On', 15_000);
        }
    },
    'app-store-preview': {
        run: async (ctx, { cell, media }) => {
            await home(ctx);
            const { width, height } = await viewport(ctx);
            const swipe = (up: boolean, duration: number) =>
                ctx.screen.swipe({
                    from: { x: width / 2, y: height * (up ? 0.8 : 0.2) },
                    to: { x: width / 2, y: height * (up ? 0.2 : 0.8) },
                    duration
                });
            await media.record(cell, async () => {
                await swipe(true, 4_000);
                await swipe(false, 4_000);
                await open(ctx, 'budgie://analytics', categoryStatistics(ctx));
                await swipe(true, 6_000);
                await swipe(false, 6_000);
            });
        }
    },

    // Social captures (marketing/social/*/source/social-capture.config.json).
    'social-accounts-scrolled': { seed: 'social-showcase-14', run: homeToDebtCard },
    'social-ai-suggestion': {
        seed: 'social-showcase-16',
        run: async ctx => {
            await typeMerchant(ctx, process.env.MERCHANT_TITLE ?? 'Whole Foods Market');
            await b.byId(ctx.screen, 'TransactionForm.MerchantInput').press('Enter');
        }
    },
    'social-voice-entry': { smoke: false, seed: 'social-showcase-15', run: ctx => openVoiceEntry(ctx, 240_000) },

    // The Apple Pay Shortcuts guide's screens (capture-apple-pay-shortcuts-guide-assets.sh).
    'apple-pay-capture-settings-screen': { prepare: applePayGuide, run: applePayCard },
    'apple-pay-capture-setup-screen': {
        prepare: applePayGuide,
        run: async ctx => {
            await applePaySettings(ctx);
            await scrollDown(ctx, b.byId(ctx.screen, 'ApplePayCaptureSettings.OpenShortcutsButton'), true);
            await b.expectId(ctx, 'ApplePayCaptureSettings.OpenShortcutsButton');
            await scrollDown(ctx, b.byId(ctx.screen, 'ApplePayCaptureSettings.SetupCard'), true);
            await b.expectId(ctx, 'ApplePayCaptureSettings.SetupCard');
        }
    },
    'apple-pay-capture-review-screen': {
        prepare: applePayGuide,
        run: async ctx => {
            await applePaySettings(ctx);
            const card = b.byId(ctx.screen, 'ApplePayCaptureSettings.ReviewCard.11111111_1111_4111_8111_111111111111');
            await scrollDown(ctx, card, true);
            await expect(card).toBeVisible();
        }
    }
};
