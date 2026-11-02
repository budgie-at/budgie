// Port of tests/app-tests/flows/23.privatbank-xlsx-import.flow.yaml.
import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import * as i from '../support/budgie/imports.ts';
import * as s from '../support/budgie/settings.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const NAME = 'Privatbank •1234';
const CARD = `AccountCard.${NAME}`;

test('23 privatbank xlsx import', { tags: ['import'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const quickImport = async () => {
        await b.byId(screen, CARD).longPress();
        await b.tapId(ctx, 'AccountCardMenu.ImportButton');
        await i.selectFileFromAppProvider(ctx, 'privatbank-statement-002, xlsx');
        await b.expectId(ctx, 'AccountCard.Balance.Privatbank_1234.547', 5_000);
        await b.tapId(ctx, CARD);
    };

    await budgie.start({ fixture: '23.db' });

    await b.phase('clear-state import', async () => {
        await a.openNewAccount(ctx);
        await b.scrollTo(ctx, 'CreateAccount.PRIVATBANK');
        await b.tapId(ctx, 'CreateAccount.PRIVATBANK');
        await i.importStatementFromPicker(ctx, 'privatbank-statement-001, xlsx', 'SyncAccountSelection.Row.Privatbank_1234', async () => {
            await b.expectText(ctx, 'Select all');
            await b.tapId(ctx, 'SyncAccountSelection.Row.Privatbank_1234');
            await b.expectText(ctx, 'Deselect all', 3_000);
            await b.tapId(ctx, 'SyncAccountSelection.ToggleAll');
            await b.expectText(ctx, 'Select all', 3_000);
            await b.tapId(ctx, 'SyncAccountSelection.ToggleAll');
            await b.expectText(ctx, 'Deselect all', 3_000);
        });
        await b.scrollTo(ctx, CARD);
        await b.expectId(ctx, 'AccountCard.Balance.Privatbank_1234.747');
        await b.tapId(ctx, CARD);
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Privatbank_Market', 20_000);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Privatbank_Salary', 20_000);
        await b.expectId(ctx, 'TransactionCard.Category.Groceries', 3_000);
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_Privatbank_ATM');
        await expect(b.byId(screen, 'TransactionCard.Label.E2E_Privatbank_ATM')).toHaveText(/Fee /);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, CARD, 10_000);
    });

    await b.phase('existing-account quick import', async () => {
        await s.openSettingsAnchor(ctx, 'general');
        await s.scrollToCentered(ctx, 'SettingsPage.AutoAssignMccCategorySwitch');
        await b.tapId(ctx, 'SettingsPage.AutoAssignMccCategorySwitch');
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, CARD, 10_000);
        await quickImport();
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_Privatbank_Coffee');
    });

    await b.phase('edit then reimport, no duplicate', async () => {
        await t.longPressEditTransaction(ctx, 'TransactionCard.Label.E2E_Privatbank_Coffee');
        await b.expectText(ctx, 'Edit Expense', 5_000);
        await c.createCategoryFromTransaction(ctx, 'E2E Privatbank Import Category');
        await t.editComment(ctx, 'EDITED PRIVATBANK DEDUP TEST');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, CARD, 10_000);
        await b.expectId(ctx, 'AccountCard.Balance.Privatbank_1234.547');
        await quickImport();
        await b.scrollTo(ctx, 'TransactionCard.Label.E2E_Privatbank_Coffee');
        await b.tapId(ctx, 'TransactionCard.Label.E2E_Privatbank_Coffee');
        await b.expectId(ctx, 'TransactionInfo.Page', 5_000);
        await b.expectText(ctx, 'EDITED PRIVATBANK DEDUP TEST');
        await b.tapId(ctx, 'PageHeader.BackButton');
        // The card's tap can push the info page twice (seen once in a run); back until the account shows.
        try {
            await b.expectId(ctx, 'AccountDetails.Page', 3_000);
        } catch {
            if (await b.byId(screen, 'TransactionInfo.Page').isVisible()) {
                await b.tapId(ctx, 'PageHeader.BackButton');
            }
        }
    });

    await b.phase('edit imported account balance', async () => {
        await b.expectId(ctx, 'AccountDetails.Page', 10_000);
        await a.openVisibleAccountSettings(ctx);
        await a.updateAccountBalance(ctx, '600');
        await b.expectId(ctx, 'AccountCard.Balance.Privatbank_1234.600', 15_000);
        await a.openAccountDetails(ctx, NAME);
        await a.assertAdjustmentTransaction(ctx, '53');
    });
});
