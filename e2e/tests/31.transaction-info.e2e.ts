// Port of tests/app-tests/flows/31.transaction-info.flow.yaml.
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import { clearAmount, createExpense, navigateToTransactions, typeDigits } from '../support/budgie/transactions.ts';

test('31 transaction info', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const text = (value: string) => expect(b.byText(screen, value)).toBeVisible();

    await budgie.start({ fixture: '31-transaction-info.db' });

    await b.phase('info rows of a plain expense', async () => {
        await navigateToTransactions(ctx);
        // `index: 1`: the second "E2E Similar Expense" card. Each card's testID is exposed twice (host and wrapper).
        const cards = screen.getByTestId('TransactionCard.Label.E2E_Similar_Expense');
        await expect(cards.first()).toBeVisible();
        // Both cards must be on screen before choosing: read mid-render, the count can make nth()
        // land on the first card's duplicate testID instead of the second card.
        await expect.poll(() => cards.count(), { timeout: 5_000 }).toBeGreaterThanOrEqual(2);
        await b.sleep(400);
        const perCard = (await cards.count()) >= 4 ? 2 : 1;
        await cards.nth(perCard).tap();
        await b.expectId(ctx, 'TransactionInfo.Page', 5_000);
        await b.expectId(ctx, 'TransactionInfo.Row.Account');
        await b.expectNoId(ctx, 'TransactionInfo.Row.Debt');
        await b.expectId(ctx, 'TransactionInfo.Row.Category');
        await b.scrollTo(ctx, 'TransactionInfo.Row.Tags');
        await b.expectId(ctx, 'TransactionInfo.Row.Tags');
        await b.expectNoId(ctx, 'TransactionInfo.Row.Source');
        await b.expectNoId(ctx, 'TransactionInfo.SimilarCard');
        await b.tapId(ctx, 'PageHeader.BackButton');
    });

    await b.phase('create similar expense', () =>
        createExpense(ctx, { amount: '10', account: 'E2E Txn Account', category: 'E2E Info Category', comment: 'E2E Similar Expense' })
    );

    await b.phase('similar card', async () => {
        await b.tapUntil(ctx, 'TransactionCard.Label.E2E_Similar_Expense', () => b.expectId(ctx, 'TransactionInfo.Page', 10_000));
        await b.scrollTo(ctx, 'TransactionInfo.SimilarCard');
        await text('2 similar · last 6 months');
        await text('Total');
        await text('$20');
        await text('Average');
        await text('$10');
        await b.scrollTo(ctx, 'TransactionInfo.SimilarBar.5');
        for (let bar = 0; bar <= 5; bar++) await b.expectId(ctx, `TransactionInfo.SimilarBar.${bar}`);
        await b.expectNoId(ctx, 'TransactionInfo.Row.Source');
    });

    await b.phase('edit a similar expense, stats update', async () => {
        await b.openLink(ctx, 'budgie://transactions/5/expense/edit');
        await expect(b.byText(screen, 'Edit Expense')).toBeVisible({ timeout: 10_000 });
        await b.expectId(ctx, 'TransactionKeypad.Digit.1');
        await clearAmount(ctx);
        await typeDigits(ctx, '20');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'TransactionInfo.Page', 15_000);
        await b.scrollTo(ctx, 'TransactionInfo.Amount', 'up');
        await expect(b.byId(screen, 'TransactionInfo.Amount')).toHaveText('$10');
        await b.scrollTo(ctx, 'TransactionInfo.SimilarCard');
        await expect(b.byText(screen, '$30')).toBeVisible({ timeout: 10_000 });
        await text('2 similar · last 6 months');
        await text('$15');
    });
});
