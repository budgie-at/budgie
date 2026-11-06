import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

const FIRST_CARD = 'TransactionForm.AccountSelector';
const TOLERANCE_PT = 1;
const TWO_LINE_TITLE_MIN_HEIGHT_PT = 30;
const SHORT_TITLE_TRANSACTION = 101;
const LONG_TITLE_TRANSACTION = 102;
const MATCHED_ONCE_TRANSACTION = 103;
const MATCHED_TWICE_TRANSACTION = 104;
const LONG_TITLE =
    'E2E Layout Long Merchant Title That Wraps Onto A Second Line — Imported bank merchant description exceeding the create form title limit';
const TAG = 'Rules Test Tag';

test('46 edit form layout stability', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const measurements: (readonly [string, number])[] = [];

    const openForm = async (transactionId: number): Promise<void> => {
        await b.openLink(ctx, 'budgie://transactions');
        await b.expectId(ctx, 'TransactionsPage.Container', 10_000);
        await b.openLink(ctx, `budgie://transactions/${transactionId}/expense/edit`);
        await b.expectId(ctx, FIRST_CARD, 10_000);
        if (await b.byId(screen, 'TransactionKeypad.Digit.1').isVisible()) {
            await b.tapId(ctx, 'TransactionForm.AmountInput');
            await expect(b.byId(screen, 'TransactionKeypad.Digit.1')).toBeHidden({ timeout: 5_000 });
        }
    };

    const measure = async (state: string, settleMs?: number): Promise<void> => {
        measurements.push([state, await b.settledY(ctx, FIRST_CARD, settleMs)]);
    };

    const toggleTag = async (): Promise<void> => {
        await b.tapUntil(ctx, 'TransactionForm.TagsSelector', () => b.expectId(ctx, 'TagPickerBottomSheet.Input', 5_000));
        await b.byId(screen, 'TagPickerBottomSheet.Input').fill(TAG);
        await b.done(ctx);
        await b.expectId(ctx, `TagPickerBottomSheet.Card.${TAG}`, 15_000);
        await b.tapId(ctx, `TagPickerBottomSheet.Card.${TAG}`);
        await b.tapId(ctx, 'tags-selector-modal-done-button');
        await b.expectNoId(ctx, 'TagPickerBottomSheet.Input');
    };

    await budgie.start({ fixture: '46-edit-form-layout.db' });

    await b.phase('initial render', async () => {
        await openForm(SHORT_TITLE_TRANSACTION);
        await b.expectNoId(ctx, 'SuggestRule.Card');
        await b.expectNoId(ctx, 'MatchingRules.Pill');
        await measure('initial render');
    });

    await b.phase('two-line merchant title', async () => {
        await openForm(LONG_TITLE_TRANSACTION);
        await b.expectText(ctx, LONG_TITLE);
        const titleBox = await b.byText(screen, LONG_TITLE).boundingBox();
        if (titleBox === null || titleBox.height < TWO_LINE_TITLE_MIN_HEIGHT_PT) {
            throw new Error(`the merchant title no longer wraps onto two lines (height ${titleBox?.height ?? 'none'}pt)`);
        }
        await measure('two-line merchant title');
    });

    await b.phase('one matching rule', async () => {
        await openForm(MATCHED_ONCE_TRANSACTION);
        await b.expectId(ctx, 'MatchingRules.Pill');
        await expect(b.byId(screen, 'MatchingRules.Pill')).toHaveAccessibleName(/^1 matching rule$/);
        await measure('matching rule');
    });

    await b.phase('two matching rules', async () => {
        await openForm(MATCHED_TWICE_TRANSACTION);
        await b.expectId(ctx, 'MatchingRules.Pill');
        await expect(b.byId(screen, 'MatchingRules.Pill')).toHaveAccessibleName(/^2 matching rules$/);
        await measure('two matching rules');
    });

    await b.phase('tag set', async () => {
        await openForm(LONG_TITLE_TRANSACTION);
        await toggleTag();
        await b.expectId(ctx, 'SuggestRule.Card', 10_000);
        await measure('tag set');
    });

    await b.phase('tag unset', async () => {
        await toggleTag();
        await b.expectNoId(ctx, 'SuggestRule.Card', 10_000);
        await measure('tag unset');
    });

    await b.phase('quick rule suggestion', async () => {
        await openForm(SHORT_TITLE_TRANSACTION);
        await b.tapUntil(ctx, 'TransactionForm.CategorySelector', () => b.expectId(ctx, 'CategoryPickerBottomSheet.Input', 5_000));
        await b.selectCategoryBySearch(ctx, 'Groceries');
        await b.expectId(ctx, 'SuggestRule.Card', 10_000);
        await measure('quick rule suggestion');
    });

    await b.phase('rule created', async () => {
        await b.tapId(ctx, 'SuggestRule.CreateRuleButton');
        await b.expectText(ctx, 'Rule created', 15_000);
        await measure('rule created', 400);
        await b.expectNoId(ctx, 'SuggestRule.Card', 15_000);
        await b.expectId(ctx, 'MatchingRules.Pill', 15_000);
        await measure('matching rule after creation');
    });

    await b.phase('edit category with the keypad collapsed and save the long imported title', async () => {
        await openForm(LONG_TITLE_TRANSACTION);
        await b.expectNoId(ctx, 'TransactionKeypad.Digit.1');
        await b.tapId(ctx, 'TransactionForm.CategorySelector');
        await b.selectCategoryBySearch(ctx, 'Groceries');
        await expect(b.byId(screen, 'TransactionForm.SubmitButton')).toBeEnabled();
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectNoId(ctx, 'TransactionForm.SubmitButton', 10_000);
        await b.openLink(ctx, `budgie://transactions/${LONG_TITLE_TRANSACTION}/expense`);
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await expect(b.byId(screen, 'TransactionInfo.Row.Category')).toHaveAccessibleName('Category, Groceries');
        await b.expectText(ctx, LONG_TITLE);
    });

    await b.phase('keep the note and Save above the keyboard', async () => {
        await openForm(LONG_TITLE_TRANSACTION);
        await b.scrollTo(ctx, 'TransactionForm.CommentInput');
        await b.tapId(ctx, 'TransactionForm.CommentInput');
        await b.fillId(ctx, 'NoteInput.Input', 'Lunch with the team');
        await b.sleep(500);
        const noteBox = await b.byId(screen, 'NoteInput.Input').boundingBox();
        const saveBox = await b.byId(screen, 'TransactionForm.SubmitButton').boundingBox();
        if (noteBox === null || saveBox === null || noteBox.y + noteBox.height > saveBox.y) {
            throw new Error(`the note overlaps Save: note=${JSON.stringify(noteBox)}, save=${JSON.stringify(saveBox)}`);
        }
        await b.tapId(ctx, 'NoteInput.SubmitButton');
        await b.expectNoId(ctx, 'NoteInput.Input');
        await expect(b.byId(screen, 'TransactionForm.SubmitButton')).toBeEnabled();
    });

    await b.phase('dismiss the keypad on field interaction and page drag', async () => {
        await openForm(LONG_TITLE_TRANSACTION);
        await b.tapId(ctx, 'TransactionForm.AmountInput');
        await b.expectId(ctx, 'TransactionKeypad.Digit.1');
        await measure('keypad expanded');
        await b.tapId(ctx, 'TransactionForm.CategorySelector');
        await b.expectId(ctx, 'CategoryPickerBottomSheet.Input');
        await b.expectNoId(ctx, 'TransactionKeypad.Digit.1');
        await b.selectCategoryBySearch(ctx, 'Groceries');
        await measure('keypad collapsed after field interaction');
        await b.tapId(ctx, 'TransactionForm.AmountInput');
        await b.expectId(ctx, 'TransactionKeypad.Digit.1');
        await ctx.screen.swipe({ from: { x: 75, y: 240 }, to: { x: 75, y: 160 }, duration: 800 });
        await b.expectNoId(ctx, 'TransactionKeypad.Digit.1');
    });

    await b.phase('preserve a pending zero fraction while entering an amount', async () => {
        await openForm(LONG_TITLE_TRANSACTION);
        await b.tapId(ctx, 'TransactionForm.AmountInput');
        await b.byId(screen, 'TransactionKeypad.Backspace').longPress();
        await b.tapId(ctx, 'TransactionKeypad.Decimal');
        await expect(b.byId(screen, 'TransactionForm.AmountInput')).toHaveAccessibleName('€0.');
        await b.tapId(ctx, 'TransactionKeypad.Digit.0');
        await expect(b.byId(screen, 'TransactionForm.AmountInput')).toHaveAccessibleName('€0.0');
    });

    const [referenceState, referenceY] = measurements[0];
    const table = measurements
        .map(([state, y]) => `  ${state}: y=${y.toFixed(2)} (${(y - referenceY).toFixed(2)} from ${referenceState})`)
        .join('\n');
    console.log(`[layout] the first card's y across the edit form's states:\n${table}`);
    const drifted = measurements.filter(([, y]) => Math.abs(y - referenceY) > TOLERANCE_PT);
    if (drifted.length > 0) {
        throw new Error(`the first card moved more than ${TOLERANCE_PT}pt across the edit form's states:\n${table}`);
    }
});
