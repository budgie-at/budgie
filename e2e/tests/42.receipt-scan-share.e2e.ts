// The share extension's hand-off of the receipt PDF is done host-side (misc.shareFixtureWithApp).
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import * as m from '../support/budgie/misc.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('42 receipt scan share', { tags: ['receipt'], platforms: ['ios'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;

    await budgie.start({ fixture: '42-receipt-scan.db' });

    await b.phase('share receipt to budgie', async () => {
        await m.shareFixtureWithApp(budgie, 'receipt/receipt-e2e.pdf', 'application/pdf');
        await b.expectId(ctx, 'TransactionForm.SubmitButton', 30_000);
        await b.expectText(ctx, 'Edit Expense');
        await expect(b.byId(screen, 'TransactionForm.SubmitButton')).toBeEnabled();
    });

    await b.phase('save receipt transaction', async () => {
        await b.tapUntil(ctx, 'TransactionForm.SubmitButton', () => b.expectNoId(ctx, 'TransactionForm.SubmitButton', 10_000));
        await t.navigateToTransactions(ctx);
        await screen
            .getByText(/^Ihr Labor/)
            .first()
            .tap();
        await expect(b.byId(screen, 'TransactionInfo.Row.Receipt')).toContainText('2026-0042', { timeout: 5_000 });
        await b.tapId(ctx, 'PageHeader.BackButton');
        await t.navigateToTransactions(ctx);
        await b.expectId(ctx, 'TransactionCard.ReceiptMarker.4242', 5_000);
    });
});
