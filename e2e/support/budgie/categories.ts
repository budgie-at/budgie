import { expect } from 'e2e';

import { byId, done, expectId, expectNoId, expectSettledId, settledBounds, sleep, tapId, tapUntil, type Ctx } from './core.ts';

/**
 * subflows/shared/create-entity-from-transaction: open a picker from the
 * transaction form, type a new name, create it and save the form that opens.
 */
export async function createEntityFromTransaction(
    ctx: Ctx,
    ids: { selector: string; pickerInput: string; createButton: string; formInput: string; submit: string },
    name: string
): Promise<void> {
    const { screen } = ctx;
    await tapUntil(ctx, ids.selector, () => expectId(ctx, ids.pickerInput, 5_000));
    const input = byId(screen, ids.pickerInput);
    await input.fill(name);
    await input.press('Enter');
    await sleep(400);
    const form = byId(screen, ids.formInput);
    await tapId(ctx, ids.createButton);
    try {
        await expect(form).toBeVisible({ timeout: 5_000 });
    } catch {
        if (await byId(screen, ids.createButton).isVisible()) {
            await tapId(ctx, ids.createButton);
        }
        await expect(form).toBeVisible();
    }
    await tapId(ctx, ids.submit);
    await expect(form).toBeHidden();
}

/** subflows/categories/create-category-from-transaction */
export async function createCategoryFromTransaction(ctx: Ctx, name: string): Promise<void> {
    await createEntityFromTransaction(
        ctx,
        {
            selector: 'TransactionForm.CategorySelector',
            pickerInput: 'CategoryPickerBottomSheet.Input',
            createButton: 'CategoryPickerBottomSheet.CreateButton',
            formInput: 'CategoryForm.Input',
            submit: 'CategoryForm.Submit'
        },
        name
    );
}

/** subflows/categories/select-category */
export async function selectCategory(ctx: Ctx, name: string): Promise<void> {
    await tapUntil(ctx, 'TransactionForm.CategorySelector', () => expectId(ctx, 'CategoryPickerBottomSheet.Input', 5_000));
    await pickCategoryCard(ctx, name);
}

/** The category picker is open: search `name` and tap its card until the picker closes. */
export async function pickCategoryCard(ctx: Ctx, name: string): Promise<void> {
    await expectSettledId(ctx, 'CategoryPickerBottomSheet.Input');
    await byId(ctx.screen, 'CategoryPickerBottomSheet.Input').fill(name);
    await done(ctx);
    const card = byId(ctx.screen, `CategoryPickerBottomSheet.Card.${name}.Label`);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.tap();
    try {
        await expectNoId(ctx, 'CategoryPickerBottomSheet.Input', 5_000);
    } catch {
        if (await card.isVisible()) {
            await card.tap();
        }
        await expectNoId(ctx, 'CategoryPickerBottomSheet.Input');
    }
}

/** subflows/categories/apply-category-filter */
export async function applyCategoryFilter(ctx: Ctx, name: string): Promise<void> {
    const bounds = await settledBounds(ctx, 'TransactionFilters.CategoryChip');
    await ctx.screen.tapAt({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 });
    await expectId(ctx, 'TransactionFilters.CategorySearchInput', 5_000);
    const input = byId(ctx.screen, 'TransactionFilters.CategorySearchInput');
    await input.fill(name);
    await input.press('Enter');
    await expectId(ctx, `TransactionFilters.CategoryOption.${name}`, 5_000);
    await tapId(ctx, `TransactionFilters.CategoryOption.${name}`);
    await tapId(ctx, 'TransactionFilters.CategoryApplyButton');
}

/** `swipe: { from: { id }, direction: LEFT }` on a `DeletableRow` until its delete action shows, then tap it. Retries a swipe that lands while the list settles. */
export async function swipeRowToDelete(ctx: Ctx, rowId: string): Promise<void> {
    const { screen } = ctx;
    const action = byId(screen, 'DeletableRow.DeleteButton');
    for (let attempt = 1; ; attempt++) {
        const box = await settledBounds(ctx, rowId);
        const y = box.y + box.height / 2;
        await screen.swipe({ from: { x: box.x + box.width / 2, y }, to: { x: box.x + 8, y }, duration: 300 });
        try {
            await expect(action).toBeVisible({ timeout: 3_000 });
            break;
        } catch (cause) {
            if (attempt === 3) {
                throw cause;
            }
            console.log(`[retry] swipe-to-delete on ${rowId} attempt ${attempt} revealed no delete action`);
        }
    }
    await action.tap();
}

/** The category/tag form's icon trigger: open the icon picker and wait until it holds still. */
export async function openIconPicker(ctx: Ctx): Promise<void> {
    await tapId(ctx, 'CategoryForm.IconTrigger');
    await expectSettledId(ctx, 'IconSelector.SearchInput');
}

/** The icon picker is open: search `query`, pick `iconId`. */
export async function pickIconFromOpenPicker(ctx: Ctx, query: string, iconId: string): Promise<void> {
    await byId(ctx.screen, 'IconSelector.SearchInput').fill(query);
    await tapId(ctx, `IconSelector.Icon.${iconId}`);
}
