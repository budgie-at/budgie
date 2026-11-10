import { expect } from 'e2e';

import * as accounts from '../support/budgie/accounts.ts';
import * as core from '../support/budgie/core.ts';
import * as imports from '../support/budgie/imports.ts';
import { test } from '../support/budgie/test.ts';

test('44 inzhur operations import', { tags: ['import'] }, async ({ budgie }) => {
    const { ctx } = budgie;
    const { screen } = ctx;

    await budgie.start({ fixture: '44-inzhur.db' });

    await core.phase('open the inzhur import', async () => {
        await accounts.openNewAccount(ctx);
        await core.scrollTo(ctx, 'CreateAccount.INZHUR');
        await core.tapId(ctx, 'CreateAccount.INZHUR');
        await core.expectId(ctx, 'Inzhur.SelectFileButton', 10_000);
    });

    await core.phase('import the operations export and read the summary', async () => {
        await core.tapUntil(ctx, 'Inzhur.SelectFileButton', () => expect(core.byText(screen, 'Cancel')).toBeVisible({ timeout: 15_000 }));
        await imports.selectFileFromAppProvider(ctx, 'inzhur-operations-001, xlsx');
        await core.expectId(ctx, 'Inzhur.OperationsSummary', 30_000);
        await core.tapId(ctx, 'Inzhur.DoneButton');
    });

    await core.phase('cash and fund holdings are shown on the institution', async () => {
        await core.scrollTo(ctx, 'InstitutionRow.1');
        await core.expectSettledId(ctx, 'InstitutionRow.1');
        await core.tapId(ctx, 'InstitutionRow.1');
        await core.expectId(ctx, 'Institution.Page', 10_000);
        await core.expectId(ctx, 'AccountCard.Balance.Cash.7_164', 10_000);
        await expect(core.byId(screen, 'AccountCard.REIT')).toHaveText(/^REIT, 300 certificates/, { timeout: 10_000 });
        await expect(core.byId(screen, 'AccountCard.Energy')).toHaveText(/^Energy, 2 certificates/, { timeout: 10_000 });
    });
    await core.phase('record a first purchase of an unheld fund', async () => {
        await core.scrollTo(ctx, 'Inzhur.PendingTopUp.1.EnterButton', 'up');
        await core.tapId(ctx, 'Inzhur.PendingTopUp.1.EnterButton');
        await core.expectId(ctx, 'Inzhur.PurchasePage');
        await core.scrollTo(ctx, 'Inzhur.PurchaseFund.Inzhur MilTech');
        await core.tapId(ctx, 'Inzhur.PurchaseFund.Inzhur MilTech');
        await core.scrollTo(ctx, 'Inzhur.PurchaseCertificatesInput');
        await core.tapId(ctx, 'Inzhur.PurchaseCertificatesInput');
        await core.expectId(ctx, 'inputView');
        await screen.getByText('1', { exact: true }).last().tap();
        await expect(core.byId(screen, 'Inzhur.PurchaseCertificatesInput')).toHaveValue('1');
        await core.done(ctx);
        await core.scrollTo(ctx, 'Inzhur.PurchaseAmountInput');
        await core.tapId(ctx, 'Inzhur.PurchaseAmountInput');
        await core.expectId(ctx, 'inputView');
        for (const digit of '1000') {
            await screen.getByText(digit, { exact: true }).last().tap();
            await core.expectId(ctx, 'inputView');
        }
        await expect(core.byId(screen, 'Inzhur.PurchaseAmountInput')).toHaveValue('1000');
        await core.done(ctx);
        await expect(core.byId(screen, 'Inzhur.PurchaseSaveButton')).toBeEnabled({ timeout: 3_000 });
        await core.tapId(ctx, 'Inzhur.PurchaseSaveButton');
        await core.expectId(ctx, 'Institution.Page', 10_000);
        await core.scrollTo(ctx, 'Institution.ShowAllAccounts');
        await core.tapId(ctx, 'Institution.ShowAllAccounts');
        await core.scrollTo(ctx, 'AccountCard.MilTech');
        await expect(core.byId(screen, 'AccountCard.MilTech')).toHaveText(/^MilTech, 1 certificate/, { timeout: 10_000 });
    });
});
