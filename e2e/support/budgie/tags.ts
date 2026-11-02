import { expect } from 'e2e';

import { createEntityFromTransaction } from './categories.ts';
import { byId, done, expectId, expectNoId, tapId, tapUntil, type Ctx } from './core.ts';

/** subflows/tags/create-tag-from-transaction */
export async function createTagFromTransaction(ctx: Ctx, name: string): Promise<void> {
    await createEntityFromTransaction(
        ctx,
        {
            selector: 'TransactionForm.TagsSelector',
            pickerInput: 'TagPickerBottomSheet.Input',
            createButton: 'TagPickerBottomSheet.CreateButton',
            formInput: 'TagForm.Input',
            submit: 'TagForm.Submit'
        },
        name
    );
}

/** subflows/shared/select-tag-by-search */
export async function selectTagBySearch(ctx: Ctx, name: string): Promise<void> {
    await expectId(ctx, 'TagPickerBottomSheet.Input');
    await byId(ctx.screen, 'TagPickerBottomSheet.Input').fill(name);
    await done(ctx);
    const card = byId(ctx.screen, `TagPickerBottomSheet.Card.${name}`);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.tap();
    try {
        await expectNoId(ctx, 'TagPickerBottomSheet.Input', 5_000);
    } catch {
        if (await card.isVisible()) await card.tap();
        await expectNoId(ctx, 'TagPickerBottomSheet.Input');
    }
}

/** Taps `TransactionForm.TagsSelector` and waits for the tag picker (the flows' inline tag-picker opening). */
export async function openTagPicker(ctx: Ctx): Promise<void> {
    await tapUntil(ctx, 'TransactionForm.TagsSelector', () => expectId(ctx, 'TagPickerBottomSheet.Input', 5_000));
}

/** Inside the open tag picker: type a new tag, create it, save its form, back on the picker. */
export async function createTagInPicker(ctx: Ctx, name: string): Promise<void> {
    const input = byId(ctx.screen, 'TagPickerBottomSheet.Input');
    await input.clear();
    await input.fill(name);
    await tapId(ctx, 'TagPickerBottomSheet.CreateButton');
    await expectId(ctx, 'TagForm.Input');
    await tapId(ctx, 'TagForm.Submit');
    await expectId(ctx, 'TagPickerBottomSheet.Input');
}

/** Closes the tag picker with its done button. */
export async function closeTagPicker(ctx: Ctx): Promise<void> {
    await expectId(ctx, 'tags-selector-modal-done-button');
    await tapId(ctx, 'tags-selector-modal-done-button');
    await expectNoId(ctx, 'TagPickerBottomSheet.Input');
}
