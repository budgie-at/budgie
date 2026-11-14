import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const COFFEE = 'CategorizeInboxGroupRow.EXPENSE|e2e confident coffee||';
const FILLER = 'CategorizeInboxGroupRow.EXPENSE|e2e categorize filler||';
const GROCER = 'CategorizeInboxGroupRow.EXPENSE|e2e tagged grocer||';

test('39 categorize inbox', { tags: ['categorize'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const count = (n: string) => expect(id('CategorizeInboxHero.Count')).toHaveText(n);
    const back = () => b.tapId(ctx, 'PageHeader.BackButton');

    await budgie.start({ fixture: 'uncategorized-inbox.db' });

    await b.phase('open inbox from transactions pill', async () => {
        await t.navigateToTransactions(ctx);
        await b.expectId(ctx, 'UncategorizedTransactionsPill.Button', 5_000);
        await expect(id('UncategorizedTransactionsPill.Button')).toHaveText('3 uncategorized');
        await b.tapId(ctx, 'UncategorizedTransactionsPill.Button');
        await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 5_000);
        await count('3');
        await b.expectId(ctx, COFFEE);
        await b.expectId(ctx, 'CategorizeInboxAcceptAllButton.Button');
    });

    await b.phase('accept all, undo', async () => {
        await b.tapId(ctx, 'CategorizeInboxAcceptAllButton.Button');
        await b.expectId(ctx, 'CategorizeInboxUndoBar', 5_000);
        await count('1');
        await b.expectNoId(ctx, COFFEE);
        await b.tapId(ctx, 'CategorizeInboxUndoBar.UndoButton');
        await count('3');
        await b.expectId(ctx, COFFEE);
        await b.expectId(ctx, 'CategorizeInboxAcceptAllButton.Button');
        await b.expectId(ctx, FILLER);
    });

    await b.phase('choose payments, transaction info', async () => {
        await b.tapId(ctx, COFFEE);
        await b.tapId(ctx, 'CategorizeInboxGroupScreen.Option.Choose payments');
        await b.expectId(ctx, 'CategorizeInboxClusterRow.3', 5_000);
        await id('CategorizeInboxClusterRow.3').longPress();
        await b.expectId(ctx, 'TransactionInfo.Page', 5_000);
        await back();
        await b.expectId(ctx, 'CategorizeInboxClusterRow.3', 5_000);
        await back();
        await b.expectId(ctx, 'CategorizeInboxGroupScreen.Option.Restaurants & Cafes', 5_000);
    });

    await b.phase('categorize group, tag follow-up', async () => {
        await b.tapId(ctx, 'CategorizeInboxGroupScreen.Option.Restaurants & Cafes');
        await b.tapId(ctx, 'CategorizeInboxGroupScreen.PrimaryButton');
        await count('1');
        await b.expectNoId(ctx, COFFEE);
        await b.tapId(ctx, 'CategorizeInboxUndoBar.FollowUpButton');
        await b.expectId(ctx, 'TagPickerBottomSheet.Card.E2E Coffee Tag', 5_000);
        await b.tapId(ctx, 'tags-selector-modal-done-button');
        await b.expectNoId(ctx, 'TagPickerBottomSheet.Card.E2E Coffee Tag', 5_000);
        await expect(id('CategorizeInboxUndoBar.FollowUpButton')).toBeDisabled({ timeout: 5_000 });
    });

    await b.phase('rule prefill', async () => {
        await b.tapId(ctx, 'CategorizeInboxUndoBar.RuleButton');
        await expect(id('RuleForm.Action.0.CategorySelector.Value')).toHaveText('Restaurants & Cafes', { timeout: 5_000 });
        await b.scrollTo(ctx, 'RuleForm.Action.1.TagSelector.Value');
        await expect(id('RuleForm.Action.1.TagSelector.Value')).toHaveText('#E2E Coffee Tag');
        await back();
        await b.expectNoId(ctx, 'RuleForm.Footer.SubmitButton', 5_000);
        await b.expectId(ctx, 'CategorizeInboxUndoBar');
    });

    await b.phase('show list', async () => {
        await b.tapId(ctx, 'CategorizeInboxPage.ShowListButton');
        await b.expectText(ctx, 'Missing categories', 5_000);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Categorize_Filler');
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Confident_Coffee');
        await back();
        await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 5_000);
        await count('1');
    });

    await b.phase('analytics uncategorized entry', async () => {
        await back();
        await b.tapId(ctx, 'TabBar.Analytics');
        await b.expectId(ctx, 'AnalyticsPage.Container', 5_000);
        await b.tapId(ctx, 'TransactionFilters.DateChipActive');
        await b.tapId(ctx, 'TransactionFilters.DatePeriod.ALL_TIME');
        await b.tapId(ctx, 'TransactionFilters.DateApplyButton');
        await expect(id('TransactionFilters.DateChipActive')).toHaveText('All time');
        await b.expectNoId(ctx, 'MorphScrim');
        await b.tapId(ctx, 'CategoryStatisticsCard.Uncategorized');
        await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 5_000);
        await count('1');
        await back();
        await b.expectId(ctx, 'AnalyticsPage.Container', 5_000);
    });

    await b.phase('untagged inbox: accept all, undo', async () => {
        await b.tapId(ctx, 'AnalyticsPage.Tab.Tags');
        await b.tapId(ctx, 'TagStatisticsCard.Untagged');
        await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 5_000);
        await count('3');
        await b.expectId(ctx, GROCER);
        await b.expectNoId(ctx, COFFEE);
        await b.tapId(ctx, 'CategorizeInboxAcceptAllButton.Button');
        await b.expectId(ctx, 'CategorizeInboxUndoBar', 5_000);
        await b.expectNoId(ctx, GROCER);
        await b.tapId(ctx, 'CategorizeInboxUndoBar.UndoButton');
        await count('3');
    });

    await b.phase('tag group, rule prefill, list', async () => {
        await b.tapId(ctx, GROCER);
        await b.tapId(ctx, 'CategorizeInboxGroupScreen.Option.E2E Grocer Tag');
        await b.tapId(ctx, 'CategorizeInboxGroupScreen.PrimaryButton');
        await count('1');
        await b.tapId(ctx, 'CategorizeInboxUndoBar.RuleButton');
        await expect(id('RuleForm.Action.0.CategorySelector.Value')).toHaveText('Groceries', { timeout: 5_000 });
        await b.scrollTo(ctx, 'RuleForm.Action.1.TagSelector.Value');
        await expect(id('RuleForm.Action.1.TagSelector.Value')).toHaveText('#E2E Grocer Tag');
        await back();
        await b.expectNoId(ctx, 'RuleForm.Footer.SubmitButton', 5_000);
        await b.expectId(ctx, 'CategorizeInboxUndoBar');
        await b.tapId(ctx, 'CategorizeInboxPage.ShowListButton');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Categorize_Filler', 5_000);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Tagged_Grocer');
    });
});
