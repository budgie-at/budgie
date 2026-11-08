import { expect } from 'e2e';

import { selectAccountBySearch } from './accounts.ts';
import { pickCategoryCard } from './categories.ts';
import { byId, byText, expectId, expectNoId, openLink, retry, scrollTo, selectCategoryBySearch, sleep, tapId, type Ctx } from './core.ts';

import type { Locator } from 'e2e';

/** Taps `testId` until `targetId` shows (each wait `timeout`), up to `1 + retries` taps. */
async function tapUntilId(ctx: Ctx, testId: string, targetId: string, retries = 3, timeout = 3_000): Promise<void> {
    await retry(retries, async () => {
        await tapId(ctx, testId);
        await expectId(ctx, targetId, timeout);
    });
}

async function focusAmount(ctx: Ctx): Promise<void> {
    if (!(await byId(ctx.screen, 'TransactionKeypad.Digit.1').isVisible())) {
        await tapId(ctx, 'TransactionForm.AmountInput');
        await expectId(ctx, 'TransactionKeypad.Digit.1');
    }
}

async function dismissKeypad(ctx: Ctx): Promise<void> {
    if (await byId(ctx.screen, 'TransactionKeypad.Digit.1').isVisible()) {
        await tapId(ctx, 'TransactionKeypad.Dismiss');
        await expectNoId(ctx, 'TransactionKeypad.Digit.1');
    }
}

/** Taps keypad digits in order (`'42'` taps 4 then 2). */
export async function typeDigits(ctx: Ctx, digits: string): Promise<void> {
    await focusAmount(ctx);
    for (const digit of digits) {
        if (digit === '.') {
            await tapId(ctx, 'TransactionKeypad.Decimal');
        } else {
            await tapId(ctx, `TransactionKeypad.Digit.${digit}`);
        }
    }
}

/** `longPressOn: TransactionKeypad.Backspace`: clears the whole amount. */
export async function clearAmount(ctx: Ctx): Promise<void> {
    await focusAmount(ctx);
    await byId(ctx.screen, 'TransactionKeypad.Backspace').longPress();
}

/** subflows/navigation/navigate-to-transactions */
export async function navigateToTransactions(ctx: Ctx): Promise<void> {
    await openLink(ctx, 'budgie://transactions');
    await expectId(ctx, 'TransactionsPage.Container', 10_000);
}

/** subflows/transactions/open-action-menu */
export async function openActionMenu(ctx: Ctx, actionItemId = 'ActionItem.Expense'): Promise<void> {
    const item = byId(ctx.screen, `${actionItemId}.Label`);
    await retry(1, async () => {
        if (!(await item.isVisible())) {
            await tapId(ctx, 'ActionButton');
        }
        await expect(item).toBeVisible({ timeout: 3_000 });
    });
}

/** subflows/transactions/open-transaction-form */
export async function openTransactionForm(ctx: Ctx, actionItemId: string, formTitle: string): Promise<void> {
    await openActionMenu(ctx, actionItemId);
    const title = byText(ctx.screen, formTitle);
    await tapId(ctx, `${actionItemId}.Label`);
    try {
        await expect(title).toBeVisible({ timeout: 5_000 });
    } catch {
        if (await byId(ctx.screen, `${actionItemId}.Label`).isVisible()) {
            await tapId(ctx, `${actionItemId}.Label`);
        }
        await expect(title).toBeVisible();
    }
    await expectId(ctx, 'TransactionKeypad.Digit.1');
}

/** subflows/transactions/select-account: picks `name` unless it is already the form's account. */
export async function selectAccount(ctx: Ctx, name: string): Promise<void> {
    const selected = ctx.screen.getByTestId(/^TransactionForm\.SelectedAccount\./).first();
    if (await selected.isVisible()) {
        const text = (await selected.textContent())?.trim();
        if (text === name) {
            return;
        }
    }
    await tapUntilId(ctx, 'TransactionForm.AccountSelector', 'AccountPickerBottomSheet.Input');
    await selectAccountBySearch(ctx, name);
}

/** subflows/transactions/enter-comment */
export async function enterComment(ctx: Ctx, comment: string): Promise<void> {
    await dismissKeypad(ctx);
    await scrollTo(ctx, 'TransactionForm.CommentInput');
    await tapUntilId(ctx, 'TransactionForm.CommentInput', 'NoteInput.Input', 1, 5_000);
    await byId(ctx.screen, 'NoteInput.Input').fill(comment);
    await tapId(ctx, 'NoteInput.SubmitButton');
    await expectNoId(ctx, 'NoteInput.Input', 5_000);
}

/** subflows/transactions/edit-comment */
export async function editComment(ctx: Ctx, comment: string): Promise<void> {
    await dismissKeypad(ctx);
    await scrollTo(ctx, 'TransactionForm.CommentInput');
    await tapUntilId(ctx, 'TransactionForm.CommentInput', 'NoteInput.Input', 1, 5_000);
    const input = byId(ctx.screen, 'NoteInput.Input');
    await input.clear();
    await input.fill(comment);
    await tapId(ctx, 'NoteInput.SubmitButton');
    await expectNoId(ctx, 'NoteInput.Input', 5_000);
}

/** subflows/transactions/submit-transaction-and-wait */
export async function submitTransactionAndWait(ctx: Ctx): Promise<void> {
    const list = byId(ctx.screen, 'TransactionsPage.Container');
    await tapId(ctx, 'TransactionForm.SubmitButton');
    try {
        await expect(list).toBeVisible({ timeout: 5_000 });
    } catch {
        if (await byId(ctx.screen, 'TransactionForm.SubmitButton').isVisible()) {
            await tapId(ctx, 'TransactionForm.SubmitButton');
        }
        await expect(list).toBeVisible({ timeout: 55_000 });
    }
}

/** subflows/transactions/submit-transaction-and-return-to-list */
export async function submitTransactionAndReturnToList(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    const list = byId(screen, 'TransactionsPage.Container');
    await tapId(ctx, 'TransactionForm.SubmitButton');
    await expect(list.or(byId(screen, 'TransactionInfo.Page')).first()).toBeVisible({ timeout: 5_000 });
    if (!(await list.isVisible())) {
        await expectId(ctx, 'TransactionInfo.Page', 5_000);
        await tapId(ctx, 'PageHeader.BackButton');
    }
    await expect(list).toBeVisible({ timeout: 15_000 });
}

/** subflows/transactions/confirm-delete-dialog */
async function confirmDeleteDialog(ctx: Ctx): Promise<void> {
    const ask = byText(ctx.screen, 'Are you sure?');
    await expect(ask).toBeVisible({ timeout: 3_000 });
    await ctx.screen.getByText('Delete').last().tap();
    await expect(ask).toBeHidden({ timeout: 10_000 });
}

/** subflows/transactions/delete-transaction */
export async function deleteTransaction(ctx: Ctx): Promise<void> {
    await expectId(ctx, 'TransactionInfo.Page', 20_000);
    await scrollTo(ctx, 'TransactionActionsMenu.DeleteButton');
    await tapId(ctx, 'TransactionActionsMenu.DeleteButton');
    await confirmDeleteDialog(ctx);
}

/** Taps a transaction card's label and waits for its info page (the flows' `tapOn` + `extendedWaitUntil TransactionInfo.Page`). */
export async function openTransaction(ctx: Ctx, labelId: string, timeout = 5_000): Promise<void> {
    await tapId(ctx, `TransactionCard.Label.${labelId}`);
    await expectId(ctx, 'TransactionInfo.Page', timeout);
}

/** subflows/transactions/long-press-transaction-action */
export async function longPressTransactionAction(ctx: Ctx, cardId: string, actionId: string): Promise<void> {
    await byId(ctx.screen, cardId).longPress();
    await expectId(ctx, actionId);
    await tapId(ctx, actionId);
}

/** subflows/transactions/long-press-edit-transaction */
export async function longPressEditTransaction(ctx: Ctx, cardId: string): Promise<void> {
    await longPressTransactionAction(ctx, cardId, 'TransactionContextMenu.EditButton');
}

/** subflows/transactions/long-press-delete-transaction */
export async function longPressDeleteTransaction(ctx: Ctx, cardId: string): Promise<void> {
    await longPressTransactionAction(ctx, cardId, 'TransactionContextMenu.DeleteButton');
    await confirmDeleteDialog(ctx);
}

/** subflows/transactions/long-press-convert-to-transfer */
export async function longPressConvertToTransfer(ctx: Ctx, cardId: string): Promise<void> {
    await byId(ctx.screen, cardId).longPress();
    await expectId(ctx, 'TransactionContextMenu.ConvertToTransferButton');
    await expectId(ctx, 'TransactionContextMenu.StartDepositButton');
    await tapId(ctx, 'TransactionContextMenu.ConvertToTransferButton');
    await expectId(ctx, 'ConvertToTransfer.Page', 10_000);
}

/** subflows/transactions/confirm-revert-consolidation */
export async function confirmRevertConsolidation(ctx: Ctx): Promise<void> {
    const ask = byText(ctx.screen, 'Separate transactions?');
    await expect(ask).toBeVisible({ timeout: 10_000 });
    await ctx.screen.getByRole('button', { name: 'Separate' }).last().tap();
    await expect(ask).toBeHidden({ timeout: 15_000 });
}

/** subflows/transactions/open-info-conversions */
export async function openInfoConversions(ctx: Ctx): Promise<void> {
    await scrollTo(ctx, 'TransactionInfo.ConvertButton');
    await tapId(ctx, 'TransactionInfo.ConvertButton');
}

/** subflows/transactions/select-split-category */
export async function selectSplitCategory(ctx: Ctx, entryIndex: number, category: string): Promise<void> {
    await tapId(ctx, `SplitEntryRow.Category.${entryIndex}`);
    await expectId(ctx, 'CategoryPickerBottomSheet.Input');
    await pickCategoryCard(ctx, category);
}

/** subflows/transactions/select-existing-tag */
export async function selectExistingTag(ctx: Ctx, tag: string): Promise<void> {
    await tapUntilId(ctx, 'TransactionForm.TagsSelector', 'TagPickerBottomSheet.Input', 1, 5_000);
    await byId(ctx.screen, 'TagPickerBottomSheet.Input').fill(tag);
    await expectId(ctx, `TagPickerBottomSheet.Card.${tag}`, 15_000);
    await tapId(ctx, `TagPickerBottomSheet.Card.${tag}`);
    await tapId(ctx, 'tags-selector-modal-done-button');
    await expectNoId(ctx, 'TagPickerBottomSheet.Input');
}

/** subflows/transactions/create-expense: a whole expense from the transactions list; `amount` is `'25'` or `'10'`, the two the subflow can type. */
export async function createExpense(
    ctx: Ctx,
    options: { amount: string; account: string; category: string; comment: string }
): Promise<void> {
    if (options.amount !== '25' && options.amount !== '10') {
        throw new Error(`createExpense: amount '${options.amount}' is not one the create-expense subflow types ('25' or '10')`);
    }
    await navigateToTransactions(ctx);
    await openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
    await selectAccount(ctx, options.account);
    await tapUntilId(ctx, 'TransactionForm.CategorySelector', 'CategoryPickerBottomSheet.Input');
    await selectCategoryBySearch(ctx, options.category);
    await enterComment(ctx, options.comment);
    await expectNoId(ctx, 'TransactionKeypad.Digit.1');
    await retry(3, async () => {
        await clearAmount(ctx);
        await typeDigits(ctx, options.amount);
        await expect(byText(ctx.screen, new RegExp(`^\\D*${options.amount}$`))).toBeVisible({ timeout: 1_000 });
    });
    await submitTransactionAndWait(ctx);
}

/**
 * The fee-sheet round trip the 08/09/10 flows share on a transaction's edit form:
 * see the sheet's first entry and save button, close it by its scrim, back on `formTitle`.
 */
export async function openAndDismissFeeSheet(ctx: Ctx, formTitle: string): Promise<void> {
    const { screen } = ctx;
    await expectId(ctx, 'SplitEntryRow.Amount.0');
    await expectId(ctx, 'TransactionFeeModal.SaveButton');
    await tapSheetScrim(ctx);
    await expectNoId(ctx, 'SplitEntryRow.Amount.0');
    await expect(byText(screen, formTitle)).toBeVisible();
}

/**
 * Taps the open morphing sheet's scrim, the accessible "Close" button behind the card, in the top-left corner
 * above the sheet frame, which starts 24pt below the safe area: it closes the sheet, or steps back when the
 * active step is a sub-step.
 */
export async function tapSheetScrim(ctx: Ctx): Promise<void> {
    const scrim = ctx.screen.getByRole('button', { name: 'Close', exact: true }).first();
    await scrim.tap({ position: await relativePoint(scrim, 0.1, 0.07) });
}

/** The transfer form's account fields: tap `selectorId` (`TransferForm.FromAccount` / `.ToAccount`), search and pick `name`. */
export async function pickTransferAccount(ctx: Ctx, selectorId: string, name: string): Promise<void> {
    await tapId(ctx, selectorId);
    await expectId(ctx, 'AccountPickerBottomSheet.Input');
    await selectAccountBySearch(ctx, name);
}

/** subflows/settings/consolidate-matches: the data settings' consolidate card, then Merge. */
export async function consolidateMatches(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    await openLink(ctx, 'budgie://settings/data');
    await sleep(600);
    await scrollTo(ctx, 'SettingsPage.RecalculateBalancesCard');
    await expectId(ctx, 'SettingsPage.RecalculateBalancesCard', 10_000);
    await scrollTo(ctx, 'SettingsPage.ConsolidateTransfersCard', 'up');
    await expectId(ctx, 'SettingsPage.ConsolidateTransfersCard', 3_000);
    const consolidate = byId(screen, 'SettingsPage.ConsolidateTransfersCard');
    await consolidate.tap({ position: await relativePoint(consolidate, 0.5, 0.25) });
    await expect(byText(screen, /high-confidence transfer/i)).toBeVisible({ timeout: 3_000 });
    await screen.getByText('Merge').last().tap();
    await expect(byText(screen, 'Transfers and refunds merged')).toBeVisible({ timeout: 30_000 });
}

/** A point inside `locator` at fractions of its size, in the node's own coordinates (for `tap({ position })`). */
async function relativePoint(locator: Locator, fx: number, fy: number): Promise<{ x: number; y: number }> {
    const box = await locator.boundingBox();
    if (box === null) {
        throw new Error('the node to tap has no bounds');
    }
    return { x: Math.round(box.width * fx), y: Math.round(box.height * fy) };
}

/** `tapOn: { text: 'Close menu', point: '10%,8%' }`: closes an open action/context menu by its backdrop. */
export async function closeMenu(ctx: Ctx): Promise<void> {
    const backdrop = ctx.screen.getByText('Close menu').first();
    await backdrop.tap({ position: await relativePoint(backdrop, 0.1, 0.08) });
    await expect(backdrop).toBeHidden({ timeout: 3_000 });
}
