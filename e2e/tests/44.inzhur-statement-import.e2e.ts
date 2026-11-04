import { expect } from 'e2e';

import * as accounts from '../support/budgie/accounts.ts';
import * as core from '../support/budgie/core.ts';
import * as imports from '../support/budgie/imports.ts';
import { test } from '../support/budgie/test.ts';

test('44 inzhur statement import', { tags: ['import'] }, async ({ budgie }) => {
    const {ctx} = budgie;
    const { screen } = ctx;

    await budgie.start({ fixture: '44-inzhur.db' });

    await core.phase('add inzhur with its cash balance', async () => {
        await accounts.openNewAccount(ctx);
        await core.scrollTo(ctx, 'CreateAccount.INZHUR');
        await core.tapId(ctx, 'CreateAccount.INZHUR');
        await core.expectId(ctx, 'Inzhur.AddButton', 10_000);
        const amount = screen.getByTestId('CreateAccount.Amount').first();
        await amount.tap();
        await amount.fill('5000');
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
        const institution = screen.getByTestId(/^InstitutionRow\.\d+$/u).first();
        await screen.scrollUntilVisible(institution, { direction: 'down', timeout: 15_000 });
        await institution.tap();
        await core.expectId(ctx, 'Institution.Page', 10_000);
        await expect(screen.getByTestId(/^AccountCard\.Balance\.Inzhur\.5_000(_0+)?$/u).first()).toBeVisible({ timeout: 10_000 });
        await expect(screen.getByTestId(/^AccountCard\.Balance\.REIT\.1_950(_0+)?$/u).first()).toBeVisible({ timeout: 10_000 });
        await expect(screen.getByTestId(/^AccountCard\.Balance\.ENERGY\.2(_0+)?$/iu).first()).toBeVisible({ timeout: 10_000 });
    });
});
