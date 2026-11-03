// Port of tests/app-tests/flows/42.receipt-scan-share.flow.yaml. The Maestro flow shares the
// receipt PDF from the Files app through the share sheet; here the share extension's hand-off
// is done host-side (misc.shareFixtureWithApp), the rest of the flow is as written.
import { expect } from 'e2e';

import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import * as m from '../support/budgie/misc.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('42 receipt scan share', { tags: ['receipt'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;

    await budgie.start({ fixture: '42-receipt-scan.db' });

    await b.phase('share receipt to budgie', async () => {
        await m.shareFixtureWithApp(budgie, 'receipt/receipt-e2e.pdf', 'application/pdf');
        await b.expectId(ctx, 'TransactionForm.SubmitButton', 30_000);
    });

    await b.phase('save receipt transaction', async () => {
        await c.createCategoryFromTransaction(ctx, 'E2E Receipt Category');
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
