import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const COFFEE = 'CategorizeInboxGroupRow.EXPENSE|e2e confident coffee||';

test('50 categorize inbox stale state', { tags: ['categorize'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const count = (n: string) => expect(id('CategorizeInboxHero.Count')).toHaveText(n, { timeout: 5_000 });
    const back = () => b.tapId(ctx, 'PageHeader.BackButton');
    const editFiledCoffee = async () => {
        await b.openLink(ctx, 'budgie://transactions/4/expense');
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await b.expectId(ctx, 'TransactionForm.CategorySelector', 10_000);
    };
    const saveAndReturnToInbox = async () => {
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Page', 15_000);
        await back();
        await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 5_000);
    };

    await budgie.start({ fixture: 'uncategorized-inbox.db' });

    await b.phase('open inbox', async () => {
        await t.navigateToTransactions(ctx);
        await b.expectId(ctx, 'UncategorizedTransactionsPill.Button', 5_000);
        await b.tapId(ctx, 'UncategorizedTransactionsPill.Button');
        await b.expectId(ctx, 'CategorizeInboxPage.ShowListButton', 5_000);
        await count('3');
    });

    await b.phase('categorizing an opened payment returns to the list', async () => {
        await b.tapId(ctx, COFFEE);
        await b.tapId(ctx, 'CategorizeInboxGroupScreen.Option.Choose payments');
        await b.expectId(ctx, 'CategorizeInboxClusterRow.3', 5_000);
        await id('CategorizeInboxClusterRow.3').longPress();
        await b.expectId(ctx, 'TransactionInfo.Page', 5_000);
        await b.tapId(ctx, 'TransactionInfo.EditButton.Label');
        await b.expectId(ctx, 'TransactionForm.CategorySelector', 10_000);
        await b.tapId(ctx, 'TransactionForm.CategorySelector');
        await b.selectCategoryBySearch(ctx, 'Groceries');
        await saveAndReturnToInbox();
        await count('2');
        await b.expectNoId(ctx, 'CategorizeInboxClusterRow.3');
        await b.expectId(ctx, COFFEE);
    });

    await b.phase('file the group, offer tag and rule', async () => {
        await b.tapId(ctx, COFFEE);
        await b.tapId(ctx, 'CategorizeInboxGroupScreen.Option.Restaurants & Cafes');
        await b.tapId(ctx, 'CategorizeInboxGroupScreen.PrimaryButton');
        await b.expectId(ctx, 'CategorizeInboxUndoBar', 5_000);
        await count('1');
        await expect(id('CategorizeInboxUndoBar.FollowUpButton')).toBeEnabled();
        await b.expectId(ctx, 'CategorizeInboxUndoBar.RuleButton');
    });

    await b.phase('tag and rule added on details update the undo bar', async () => {
        await editFiledCoffee();
        await t.selectExistingTag(ctx, 'E2E Coffee Tag');
        await b.expectId(ctx, 'SuggestRule.CreateRuleButton', 10_000);
        await b.tapId(ctx, 'SuggestRule.CreateRuleButton');
        await b.expectNoId(ctx, 'SuggestRule.CreateRuleButton', 10_000);
        await saveAndReturnToInbox();
        await b.expectId(ctx, 'CategorizeInboxUndoBar', 5_000);
        await expect(id('CategorizeInboxUndoBar.FollowUpButton')).toBeDisabled({ timeout: 5_000 });
        await b.expectNoId(ctx, 'CategorizeInboxUndoBar.RuleButton', 5_000);
    });

    await b.phase('category changed on details hides undo', async () => {
        await editFiledCoffee();
        await b.tapId(ctx, 'TransactionForm.CategorySelector');
        await b.selectCategoryBySearch(ctx, 'Groceries');
        await saveAndReturnToInbox();
        await b.expectNoId(ctx, 'CategorizeInboxUndoBar', 5_000);
        await count('1');
    });
});
