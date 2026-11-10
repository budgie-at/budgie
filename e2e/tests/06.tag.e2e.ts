import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import * as m from '../support/budgie/misc.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('06 tag', { tags: ['tags'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const nameAndSubmit = async (name: string, clear = false) => {
        const input = id('TagForm.Input');
        await input.tap();
        if (clear) {
            await input.clear();
        }
        await input.fill(name);
        await b.done(ctx);
        await b.tapId(ctx, 'TagForm.Submit');
    };
    const newTag = async (name: string) => {
        await b.tapId(ctx, 'ActionButton');
        await b.tapText(ctx, 'Tag');
        await nameAndSubmit(name);
        await b.expectId(ctx, `TagCard.${name}`);
    };

    await budgie.start({ fixture: '06.db' });
    await b.phase('open tags', async () => {
        await a.navigateToSettings(ctx);
        await a.openSettingsCard(ctx, 'SettingsPage.ManageTagsCard', 'TagPage.SearchInput');
    });

    await b.phase('create primary tag', () => newTag('E2E Tag Primary'));
    await b.phase('create second tag for search', () => newTag('E2E Tag Search'));

    await b.phase('search and open result', async () => {
        await b.fillId(ctx, 'TagPage.SearchInput', 'Search');
        await b.expectId(ctx, 'TagCard.E2E Tag Search');
        await b.expectNoId(ctx, 'TagCard.E2E Tag Primary');
        await b.tapId(ctx, 'TagCard.E2E Tag Search');
        await b.expectId(ctx, 'TagForm.Delete', 10_000);
        await b.tapId(ctx, 'TagForm.Delete');
        await screen.getByText('Delete').last().tap();
        await b.expectNoId(ctx, 'TagForm.Delete', 10_000);
        await b.expectNoId(ctx, 'TagCard.E2E Tag Search');
        await id('TagPage.SearchInput').clear();
        await b.expectId(ctx, 'TagCard.E2E Tag Primary');
        await b.expectNoId(ctx, 'TagCard.E2E Tag Search');
    });

    await b.phase('edit primary tag', async () => {
        await b.tapId(ctx, 'TagCard.E2E Tag Primary');
        await nameAndSubmit('E2E Tag Updated', true);
        await b.expectId(ctx, 'TagCard.E2E Tag Updated');
        await b.expectNoId(ctx, 'TagCard.E2E Tag Primary');
        await c.swipeRowToDelete(ctx, 'TagCard.E2E Tag Updated');
        await expect(screen.getByText(/^Delete .E2E Tag Updated.\?$/i).first()).toBeVisible();
        await screen.getByText('Delete').last().tap();
        await b.expectNoId(ctx, 'TagCard.E2E Tag Updated', 10_000);
    });
});

test('06 tag merge', { tags: ['tags'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '14.db' });

    await b.phase('merge a used tag into another', async () => {
        await a.navigateToSettings(ctx);
        await a.openSettingsCard(ctx, 'SettingsPage.ManageTagsCard', 'TagPage.SearchInput');
        await b.tapId(ctx, 'TagCard.E2E Filter Expense Tag');
        await b.expectId(ctx, 'TagForm.Merge', 10_000);
        await b.tapId(ctx, 'TagForm.Merge');
        await b.expectSettledId(ctx, 'TagPickerBottomSheet.CommitButton');
        await b.tapId(ctx, 'TagPickerBottomSheet.Card.E2E Filter Income Tag');
        await b.expectText(ctx, /gets? “E2E Filter Income Tag”\. “E2E Filter Expense Tag” will be removed\./);
        await b.tapId(ctx, 'TagPickerBottomSheet.CommitButton');
        await b.expectNoId(ctx, 'TagPickerBottomSheet.CommitButton', 10_000);
        await b.expectNoId(ctx, 'TagCard.E2E Filter Expense Tag', 10_000);
        await b.expectId(ctx, 'TagCard.E2E Filter Income Tag');
    });

    await b.phase('merged transactions carry the destination tag', async () => {
        await t.navigateToTransactions(ctx);
        await m.revealChip(ctx, 'TransactionFilters.AmountChip', 'TransactionFilters.CategoryChip', 'right');
        await m.revealChip(ctx, 'TransactionFilters.CategoryChip', 'TransactionFilters.TagChip', 'right');
        await b.tapId(ctx, 'TransactionFilters.TagChip');
        await b.expectId(ctx, 'TransactionFilters.TagSearchInput', 5_000);
        await b.fillId(ctx, 'TransactionFilters.TagSearchInput', 'Income Tag');
        await b.byId(ctx.screen, 'TransactionFilters.TagSearchInput').press('Enter');
        await b.expectId(ctx, 'TagPickerBottomSheet.Card.E2E Filter Income Tag', 5_000);
        await b.tapId(ctx, 'TagPickerBottomSheet.Card.E2E Filter Income Tag');
        await b.tapId(ctx, 'TransactionFilters.TagApplyButton');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Filter_Expense');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Filter_Income');
    });
});
