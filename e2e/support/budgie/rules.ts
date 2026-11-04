import { expect } from 'e2e';

import { swipeRowToDelete } from './categories.ts';
import {
    byId,
    byText,
    expectId,
    expectNoId,
    openLink,
    scrollTo,
    scrollToCentre,
    selectCategoryBySearch,
    sleep,
    tapId,
    tapUntil,
    type Ctx
} from './core.ts';
import { importTestTransactions } from './imports.ts';

/** subflows/navigate-to-rules */
export async function navigateToRules(ctx: Ctx): Promise<void> {
    await openLink(ctx, 'budgie://settings/rules');
    await expectId(ctx, 'RulesPage.Page', 15_000);
}

/** subflows/rules/open-create-rule-form */
export async function openCreateRuleForm(ctx: Ctx): Promise<void> {
    await tapUntil(ctx, 'ActionButton', () => expect(byId(ctx.screen, 'RulesPage.CreateButton.Label')).toBeVisible({ timeout: 5_000 }));
    await tapUntil(ctx, 'RulesPage.CreateButton.Label', () => expect(byText(ctx.screen, 'Create Rule')).toBeVisible({ timeout: 5_000 }));
}

/** subflows/rules/submit-rule-skip-existing */
export async function submitRuleSkipExisting(ctx: Ctx): Promise<void> {
    await tapId(ctx, 'RuleForm.Footer.SubmitButton');
    const ask = byText(ctx.screen, 'Apply to existing transactions?');
    if (!(await ask.isVisible())) {
        await sleep(800);
    }
    if (await ask.isVisible()) {
        await ctx.screen.getByText('Skip').last().tap();
    }
    await expectId(ctx, 'RulesPage.Page', 10_000);
}

/** subflows/rules/submit-rule-apply-existing */
export async function submitRuleApplyExisting(ctx: Ctx): Promise<void> {
    await tapId(ctx, 'RuleForm.Footer.SubmitButton');
    await expect(byText(ctx.screen, 'Apply to existing transactions?')).toBeVisible();
    await ctx.screen.getByText('Apply').last().tap();
    await expectId(ctx, 'RulesPage.Page', 10_000);
    await expect(byText(ctx.screen, 'Rule applied')).toBeVisible({ timeout: 15_000 });
}

/** subflows/rules/delete-first-rule: swipe the first card left, tap its delete action, confirm. Retries a swipe that lands while the list settles. */
export async function deleteFirstRule(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    await swipeRowToDelete(ctx, 'RulesPage.RuleCard.0');
    await expect(byText(screen, 'Delete this rule?')).toBeVisible();
    await screen.getByText('Delete').last().tap();
    await expect(byText(screen, 'Delete this rule?')).toBeHidden();
}

/** The `[ card, conditions, actions ]` assertions the rules flows repeat after each save. */
export async function expectRuleCard(ctx: Ctx, index = 0, full = true): Promise<void> {
    await expectId(ctx, `RulesPage.RuleCard.${index}`);
    if (!full) {
        return;
    }
    await expectId(ctx, `RulesPage.RuleCardConditions.${index}`);
    await expectId(ctx, `RulesPage.RuleCardActions.${index}`);
}

export async function expectNoRules(ctx: Ctx): Promise<void> {
    await expectId(ctx, 'RulesPage.EmptyState');
}

/** Picks an option card of the rule form's selector sheet: field, operator, action type, source. */
export async function pick(ctx: Ctx, opener: string, option: string): Promise<void> {
    await tapId(ctx, opener);
    const card = byId(ctx.screen, `RuleForm.SelectorCard.${option}`);
    await expect(card).toBeVisible();
    await card.tap();
    await expect(card).toBeHidden();
}

/** subflows/rules/open-action-category-selector: the selector row, else its value, until the category sheet shows. */
export async function openActionCategorySelector(ctx: Ctx, index = 0): Promise<void> {
    const input = byId(ctx.screen, 'CategoryPickerBottomSheet.Input');
    await tapId(ctx, `RuleForm.Action.${index}.CategorySelector`);
    if (!(await input.isVisible())) {
        await sleep(800);
    }
    if (await input.isVisible()) {
        return;
    }
    await tapId(ctx, `RuleForm.Action.${index}.CategorySelector.Value`);
    await expect(input).toBeVisible({ timeout: 5_000 });
}

/** subflows/rules/delete-first-rule-via-form: open the first rule, delete it from the form footer. */
export async function deleteFirstRuleViaForm(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    await tapUntil(ctx, 'RulesPage.RuleCardActions.0', () => expect(byText(screen, 'Edit Rule')).toBeVisible({ timeout: 5_000 }));
    // centerElement: at the bottom of the form the label sits under the floating Save footer, which takes the tap.
    await scrollToCentre(ctx, 'RuleForm.Footer.DeleteButton.Label');
    // The form can still be animating in: a tap then is dropped, so tap again until the confirmation shows.
    await tapUntil(ctx, 'RuleForm.Footer.DeleteButton.Label', () =>
        expect(screen.getByText('Delete').last()).toBeVisible({ timeout: 3_000 })
    );
    await screen.getByText('Delete').last().tap();
    await expectId(ctx, 'RulesPage.Page', 5_000);
}

/** The rule form's account picker sheet is opening: search `name`, pick it, wait for the sheet to close. */
export async function selectAccountInPicker(ctx: Ctx, name: string): Promise<void> {
    const input = byId(ctx.screen, 'AccountPickerBottomSheet.Input');
    await expect(input).toBeVisible();
    await input.fill(name);
    await expectId(ctx, `AccountPickerBottomSheet.Option.${name}`);
    await tapId(ctx, `AccountPickerBottomSheet.Option.${name}`);
    await expect(input).toBeHidden();
}

/** subflows/rules/create-suggested-rule-from-transaction: import `csv`, recategorise `cardId`, accept the suggested rule, check its condition count, delete it. */
export async function createSuggestedRuleFromTransaction(
    ctx: Ctx,
    csvFixturesUri: string,
    options: { category: string; csv: string; conditions: 2 | 3; cardId: string }
): Promise<void> {
    const { screen } = ctx;
    await importTestTransactions(ctx, csvFixturesUri, options.csv);
    await tapId(ctx, 'TabBar.Transactions');
    await expectId(ctx, options.cardId, 10_000);
    await tapUntil(ctx, options.cardId, () => expectId(ctx, 'TransactionInfo.Page', 10_000));
    await tapId(ctx, 'TransactionInfo.EditButton.Label');
    await expectId(ctx, 'TransactionForm.CategorySelector', 10_000);
    await tapId(ctx, 'TransactionForm.CategorySelector');
    await selectCategoryBySearch(ctx, options.category);
    await expectId(ctx, 'SuggestRule.CreateRuleButton', 10_000);
    await tapId(ctx, 'SuggestRule.CreateRuleButton');
    await expectNoId(ctx, 'SuggestRule.CreateRuleButton', 10_000);
    await tapId(ctx, 'PageHeader.BackButton');
    await navigateToRules(ctx);
    await expectId(ctx, 'RulesPage.RuleCard.0', 10_000);
    await expectId(ctx, 'RulesPage.RuleCardActions.0', 10_000);
    await tapUntil(ctx, 'RulesPage.RuleCardActions.0', () => expect(byText(screen, 'Edit Rule')).toBeVisible());
    await expectId(ctx, 'RuleForm.Condition.0.Row');
    await expectId(ctx, 'RuleForm.Condition.1.Row');
    if (options.conditions === 3) {
        // The third row sits under the footer on a 6.3" screen.
        await dragUp(ctx, 'RuleForm.Condition.1.Row');
        await expectId(ctx, 'RuleForm.Condition.2.Row');
    }
    await tapUntil(ctx, 'PageHeader.BackButton', () => expectId(ctx, 'RulesPage.Page', 5_000));
    await deleteFirstRuleViaForm(ctx);
    await expectNoRules(ctx);
}

/** A raw finger drag up from `testId`'s centre (300 pt): moves the rule form, which ignores synthesized scrolls. */
async function dragUp(ctx: Ctx, testId: string, distance = 300): Promise<void> {
    const box = await byId(ctx.screen, testId).boundingBox();
    if (box === null) {
        throw new Error(`${testId} has no bounds`);
    }
    const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await ctx.screen.swipe({ from, to: { x: from.x, y: Math.max(from.y - distance, 80) }, duration: 400 });
    await sleep(400);
}

/** subflows/transactions/assert-transaction-tag, with the back tap retried (it can land while the info page settles). */
export async function assertTransactionTagged(ctx: Ctx, labelId: string, tag: string): Promise<void> {
    await tapUntil(ctx, `TransactionCard.Label.${labelId}`, () => expectId(ctx, 'TransactionInfo.Page', 5_000));
    await scrollTo(ctx, 'TransactionInfo.Row.Tags');
    // The info page draws the tag inside the row's accessible name ("Tags, <tag>"), not as a node of its own.
    const escaped = tag.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    await expect(byId(ctx.screen, 'TransactionInfo.Row.Tags')).toHaveAccessibleName(new RegExp(`(^|, )${escaped}(,|$)`), {
        timeout: 5_000
    });
    await sleep(400);
    await tapUntil(ctx, 'PageHeader.BackButton', () => expectId(ctx, 'TransactionsPage.Container', 5_000));
}
