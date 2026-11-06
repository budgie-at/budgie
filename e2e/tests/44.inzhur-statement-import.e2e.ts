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
        await core.sleep(600);
        await core.tapId(ctx, 'InstitutionRow.1');
        await core.expectId(ctx, 'Institution.Page', 10_000);
        await core.expectId(ctx, 'AccountCard.Balance.Cash.5_164', 10_000);
        await expect(core.byId(screen, 'AccountCard.Inzhur REIT')).toHaveText(/^Inzhur REIT, 300 certificates/, { timeout: 10_000 });
        await expect(core.byId(screen, 'AccountCard.Inzhur Energy')).toHaveText(/^Inzhur Energy, 2 certificates/, { timeout: 10_000 });
    });
});
