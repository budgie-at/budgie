import { expect } from 'e2e';

import {
    byId,
    byText,
    expectId,
    fillId,
    openLink,
    retry,
    scrollTo,
    scrollToCentre,
    selectCategoryBySearch,
    settledBounds,
    sleep,
    tapId,
    tapUntil,
    type Ctx
} from './core.ts';

export async function openEmptyBudget(ctx: Ctx): Promise<void> {
    await openLink(ctx, 'budgie:///');
    await expectId(ctx, 'BudgetWidget.EmptyState', 3_000);
    await tapUntil(ctx, 'BudgetWidget.EmptyState', () => expectId(ctx, 'BudgetCreate.Template.Empty', 5_000));
}

/** subflows/budget/choose-empty-canvas */
export async function chooseEmptyCanvas(ctx: Ctx): Promise<void> {
    await expectId(ctx, 'BudgetCreate.Template.Empty', 5_000);
    await tapId(ctx, 'BudgetCreate.Template.Empty');
    await expectId(ctx, 'BudgetSetup.OverallLimitInput', 5_000);
}

/** Types `value` into a budget amount input and waits for the field to show it. */
export async function fillAmount(ctx: Ctx, testId: string, value: string): Promise<void> {
    await tapId(ctx, testId);
    await expectId(ctx, 'inputView');
    await sleep(600);
    await retry(1, async attempt => {
        if (attempt > 1) {
            await sleep(800);
        }
        await fillId(ctx, testId, value);
    });
    await expect(byId(ctx.screen, testId)).toHaveValue(value, { timeout: 3_000 });
}

/** The budget setup's overall limit: scroll to it, type it. */
export async function setOverallLimit(ctx: Ctx, value: string): Promise<void> {
    // Centred first: at the bottom edge the field's tap lands on the Save footer and saves the budget early.
    await scrollToCentre(ctx, 'BudgetSetup.OverallLimitInput');
    await fillAmount(ctx, 'BudgetSetup.OverallLimitInput', value);
    await endAmountEditing(ctx);
}

/**
 * The decimal pad has no dismiss key and covers the rows below the field: tap
 * the "Limit from" label above it (the flows tap "Category limits", which the
 * pad hides here), else drag the form a little, until the pad is gone.
 */
async function endAmountEditing(ctx: Ctx): Promise<void> {
    const { screen } = ctx;
    const pad = byId(screen, 'inputView');
    if (!(await pad.isVisible())) {
        return;
    }
    const label = byText(screen, 'Limit from');
    if (await label.isVisible()) {
        await label.tap();
    }
    await sleep(400);
    if (!(await pad.isVisible())) {
        return;
    }
    const box = await label.boundingBox();
    if (box !== null) {
        const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        await screen.swipe({ from, to: { x: from.x, y: from.y + 60 }, duration: 300 });
    }
    await expect(pad).toBeHidden({ timeout: 3_000 });
}

/** The budget setup's "add category limit": scroll to it, open the category sheet (retried like the flow), pick `category`, wait for row `index`. */
export async function addCategoryLimit(ctx: Ctx, category: string, index = 0, scroll = true): Promise<void> {
    if (scroll) {
        await scrollTo(ctx, 'BudgetSetup.CategoryLimitAddButton');
        await sleep(400);
    }
    await retry(3, async () => {
        await tapId(ctx, 'BudgetSetup.CategoryLimitAddButton');
        await expectId(ctx, 'CategoryPickerBottomSheet.Input', 3_000);
    });
    await selectCategoryBySearch(ctx, category);
    await expectId(ctx, `BudgetSetup.CategoryLimit.${index}.Row`, 3_000);
}

/** `addCategoryLimit` + its amount + the "Category limits" tap that leaves the field. */
export async function addCategoryLimitWithAmount(ctx: Ctx, category: string, index: number, amount: string, scroll = true): Promise<void> {
    await addCategoryLimit(ctx, category, index, scroll);
    await fillAmount(ctx, `BudgetSetup.CategoryLimit.${index}.AmountInput`, amount);
    await byText(ctx.screen, 'Category limits').tap();
}

/** Leaves an amount field by tapping the "Category limits" heading, then saves the budget setup. */
export async function saveBudgetSetup(ctx: Ctx): Promise<void> {
    await byText(ctx.screen, 'Category limits').tap();
    await expectId(ctx, 'BudgetSetup.SaveButton', 3_000);
    await tapId(ctx, 'BudgetSetup.SaveButton');
    await expectId(ctx, 'BudgetWidget.Card', 3_000);
}

/** `tapOn: TabBar.Home` + the budget widget's spent label (and optionally category `categoryId`'s share) the budget flows check after each change. */
export async function expectWidgetSpent(
    ctx: Ctx,
    spent: string,
    category?: { id: string | number; share: string },
    timeout = 3_000
): Promise<void> {
    await tapId(ctx, 'TabBar.Home');
    await expect(byId(ctx.screen, 'BudgetWidget.SpentLabel')).toHaveText(spent, { timeout });
    if (category !== undefined) {
        await expect(byId(ctx.screen, `BudgetWidget.CategorySpentLabel.${category.id}`)).toHaveText(category.share);
    }
}

/** Swipes a deletable row left from its centre until its delete action shows, then taps it (the swipe retried while the list settles). */
export async function swipeToDelete(ctx: Ctx, rowId: string): Promise<void> {
    const { screen } = ctx;
    const action = byId(screen, 'DeletableRow.DeleteButton');
    await retry(2, async () => {
        const box = await settledBounds(ctx, rowId);
        // The row's testID sits on its short label: drag from well right of it to near the screen's left edge.
        const y = box.y + box.height / 2;
        await screen.swipe({ from: { x: box.x + 260, y }, to: { x: 20, y }, duration: 300 });
        await expect(action).toBeVisible({ timeout: 3_000 });
    });
    await action.tap();
}

/** From the budget details screen: the edit button, until the edit form shows. */
export async function openEditBudget(ctx: Ctx): Promise<void> {
    await tapId(ctx, 'BudgetDetails.EditButton');
    await expect(byText(ctx.screen, 'Edit budget')).toBeVisible({ timeout: 3_000 });
}

/** Saves the setup form once the amount pad is gone (the flows tap the category limits header for that). */
export async function saveFromHeader(ctx: Ctx): Promise<void> {
    // The flows tap the header only to leave the amount field; with the pad already gone that tap can land on the save footer.
    await endAmountEditing(ctx);
    await expectId(ctx, 'BudgetSetup.SaveButton', 3_000);
    await tapId(ctx, 'BudgetSetup.SaveButton');
}
