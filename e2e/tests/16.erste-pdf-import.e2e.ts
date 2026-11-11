import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import * as i from '../support/budgie/imports.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const CARD = 'AccountCard.Erste EUR';

test('16 erste pdf import', { tags: ['import'], platforms: ['ios'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const quickImport = async (file: string) => {
        await b.byId(screen, CARD).longPress();
        await b.tapId(ctx, 'AccountCardMenu.ImportButton');
        await i.selectFileFromAppProvider(ctx, file);
        await b.expectId(ctx, 'AccountCard.Balance.Erste_EUR._3_412', 60_000);
    };
    const editArealis = async () => {
        await b.scrollTo(ctx, 'TransactionCard.Label.AREALIS_GmbH');
        await t.longPressEditTransaction(ctx, 'TransactionCard.Label.AREALIS_GmbH');
        await b.expectText(ctx, 'Edit Expense', 5_000);
    };

    await budgie.start({ fixture: '16.db' });

    await b.phase('clear-state import', async () => {
        await a.openNewAccount(ctx);
        await b.scrollTo(ctx, 'CreateAccount.ERSTE');
        await b.tapId(ctx, 'CreateAccount.ERSTE');
        await i.importStatementFromPicker(ctx, 'erste-statement-008, pdf', 'SyncAccountSelection.Row.Erste_EUR');
        await b.scrollTo(ctx, CARD);
        await b.expectId(ctx, 'AccountCard.Balance.Erste_EUR._478');
        await b.tapId(ctx, CARD);
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
        await b.expectId(ctx, 'TransactionCard.Label.Sample_Counterparty', 20_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, CARD, 10_000);
    });

    await b.phase('existing-account quick import', async () => {
        await quickImport('erste-statement-009, pdf');
        await b.tapId(ctx, CARD);
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
        await b.scrollTo(ctx, 'TransactionCard.Label.AREALIS_GmbH');
    });

    await b.phase('edit then reimport, no duplicate', async () => {
        await editArealis();
        await c.selectCategory(ctx, 'Groceries');
        await t.editComment(ctx, 'EDITED FOR DEDUP TEST');
        await b.expectId(ctx, 'TransactionForm.SubmitButton', 15_000);
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, CARD, 10_000);
        await b.expectId(ctx, 'AccountCard.Balance.Erste_EUR._3_412');
        await quickImport('erste-statement-009, pdf');
        await b.tapId(ctx, CARD);
        await editArealis();
        await b.tapId(ctx, 'TransactionForm.CommentInput');
        await b.expectId(ctx, 'NoteInput.Input', 5_000);
        await expect(screen.getByText('EDITED FOR DEDUP TEST').or(screen.getByDisplayValue('EDITED FOR DEDUP TEST')).first()).toBeVisible();
        await b.tapId(ctx, 'NoteInput.SubmitButton');
        await b.tapId(ctx, 'PageHeader.BackButton');
    });
});
