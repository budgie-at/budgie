import { expect } from 'e2e';
import { byId, byText, expectId, fillId, openLink, scrollTo, selectCategoryBySearch, sleep, tapId, type Ctx } from './core.ts';
import { retry } from './transactions.ts';

/** `openLink: budgie://budget` + the empty budget widget the flows tap to start a budget. */
export async function openEmptyBudget(ctx: Ctx): Promise<void> {
  await openLink(ctx, 'budgie://budget');
  await expectId(ctx, 'BudgetWidget.EmptyState', 3_000);
  await tapId(ctx, 'BudgetWidget.EmptyState');
}

/** subflows/budget/choose-empty-canvas */
export async function chooseEmptyCanvas(ctx: Ctx): Promise<void> {
  await expectId(ctx, 'BudgetCreate.Template.Empty', 5_000);
  await tapId(ctx, 'BudgetCreate.Template.Empty');
  await expectId(ctx, 'BudgetSetup.OverallLimitInput', 5_000);
}

/** Types `value` into a budget amount input and waits for the field to show it. */
export async function fillAmount(ctx: Ctx, testId: string, value: string): Promise<void> {
  // A fill right after the form opens can tap the field mid-transition and find nothing focused: retried once it settles.
  await retry(1, async (attempt) => {
    if (attempt > 1) await sleep(800);
    await fillId(ctx, testId, value);
  });
  await expect(byId(ctx.screen, testId)).toHaveValue(value, { timeout: 3_000 });
}

/** The budget setup's overall limit: scroll to it, type it. */
export async function setOverallLimit(ctx: Ctx, value: string): Promise<void> {
  await scrollTo(ctx, 'BudgetSetup.OverallLimitInput');
  await fillAmount(ctx, 'BudgetSetup.OverallLimitInput', value);
  await endAmountEditing(ctx);
}

/**
 * The decimal pad has no dismiss key and covers the rows below the field: tap
 * the "Limit from" label above it (the flows tap "Category limits", which the
 * pad hides here), else drag the form a little, until the pad is gone.
 */
export async function endAmountEditing(ctx: Ctx): Promise<void> {
  const { screen } = ctx;
  const pad = byId(screen, 'inputView');
  if (!(await pad.isVisible())) return;
  const label = byText(screen, 'Limit from');
  if (await label.isVisible()) await label.tap();
  await sleep(400);
  if (!(await pad.isVisible())) return;
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
export async function expectWidgetSpent(ctx: Ctx, spent: string, category?: { id: string | number; share: string }, timeout = 3_000): Promise<void> {
  await tapId(ctx, 'TabBar.Home');
  await expect(byId(ctx.screen, 'BudgetWidget.SpentLabel')).toHaveText(spent, { timeout });
  if (category !== undefined) await expect(byId(ctx.screen, `BudgetWidget.CategorySpentLabel.${category.id}`)).toHaveText(category.share);
}

/** Swipes a deletable row left from its centre until its delete action shows, then taps it (the swipe retried while the list settles). */
export async function swipeToDelete(ctx: Ctx, rowId: string): Promise<void> {
  const { screen } = ctx;
  const action = byId(screen, 'DeletableRow.DeleteButton');
  await retry(2, async () => {
    await sleep(600);
    const box = await byId(screen, rowId).boundingBox();
    if (box === null) throw new Error(`${rowId} has no bounds`);
    // The row's testID sits on its short label: drag from well right of it to near the screen's left edge, as Maestro's LEFT swipe does.
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

/** Scrolls the setup form to `testId`, then drags it further up until it clears the fixed save footer, which would take a tap aimed at it. */
export async function scrollAboveFooter(ctx: Ctx, testId: string): Promise<void> {
  const { screen } = ctx;
  await scrollTo(ctx, testId);
  for (let attempt = 0; attempt < 3; attempt++) {
    const target = await byId(screen, testId).boundingBox();
    const footer = await byId(screen, 'BudgetSetup.SaveButton').boundingBox();
    if (target === null || footer === null || target.y + target.height < footer.y - 8) return;
    // Drag from well above the footer: a drag that starts on it moves nothing.
    const x = target.x + target.width / 2;
    const y = footer.y - 150;
    await screen.swipe({ from: { x, y }, to: { x, y: y - 250 }, duration: 400 });
    await sleep(400);
  }
}
