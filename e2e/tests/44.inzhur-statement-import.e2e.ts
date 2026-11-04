import { expect } from 'e2e';

import * as accounts from '../support/budgie/accounts.ts';
import * as core from '../support/budgie/core.ts';
import * as imports from '../support/budgie/imports.ts';
import { test } from '../support/budgie/test.ts';
import * as transactions from '../support/budgie/transactions.ts';

test('44 inzhur statement import', { tags: ['import'] }, async ({ budgie }) => {
    const { ctx } = budgie;
    const { screen } = ctx;

    await budgie.start({ fixture: '44-inzhur.db' });

    await core.phase('add inzhur with its cash balance', async () => {
        await accounts.openNewAccount(ctx);
        await core.scrollTo(ctx, 'CreateAccount.INZHUR');
        await core.tapId(ctx, 'CreateAccount.INZHUR');
        await core.expectId(ctx, 'Inzhur.AddButton', 10_000);
        await transactions.typeDigits(ctx, '5000');
        await core.tapId(ctx, 'Inzhur.AddButton');
        await core.expectId(ctx, 'Inzhur.SelectFileButton', 10_000);
    });

    await core.phase('import the statement and read the summary', async () => {
        await core.tapUntil(ctx, 'Inzhur.SelectFileButton', () => expect(core.byText(screen, 'Cancel')).toBeVisible({ timeout: 15_000 }));
        await imports.selectFileFromAppProvider(ctx, 'inzhur-statement-001, pdf');
        await core.expectId(ctx, 'Inzhur.Summary', 30_000);
        await core.expectId(ctx, 'Inzhur.SummaryFund.UA5000014044');
        await core.expectId(ctx, 'Inzhur.SummaryFund.UA5000012246');
        await core.tapId(ctx, 'Inzhur.DoneButton');
    });

    await core.phase('cash and fund holdings are shown on the institution', async () => {
        await core.scrollTo(ctx, 'InstitutionRow.1');
        await core.sleep(600);
        await core.tapId(ctx, 'InstitutionRow.1');
        await core.expectId(ctx, 'Institution.Page', 10_000);
        await core.expectId(ctx, 'AccountCard.Balance.Inzhur_cash.5_000', 10_000);
        await expect(core.byText(screen, '1,950 certificates')).toBeVisible({ timeout: 10_000 });
        await expect(core.byText(screen, '2 certificates')).toBeVisible({ timeout: 10_000 });
    });
});
