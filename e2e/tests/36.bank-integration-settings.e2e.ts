// Port of tests/app-tests/flows/36.bank-integration-settings.flow.yaml.
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('36 bank integration settings', { tags: ['sync'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const toggle = (row: number) => id(`BankIntegration.AccountRow.${row}.Toggle`);
    const openIntegration = async (n: number) => {
        await b.openLink(ctx, `budgie://bank-integration/${n}`);
        await b.expectId(ctx, 'BankIntegration.Page', 10_000);
    };
    const openAccountEdit = async () => {
        await b.openLink(ctx, 'budgie://account/1/update');
        await b.expectId(ctx, 'AccountForm.ScrollView', 10_000);
    };
    const back = async (to: string) => {
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, to, 10_000);
    };

    await budgie.start({ fixture: '21.db' });

    await b.phase('home integration section', async () => {
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await b.scrollTo(ctx, 'InstitutionRow.1');
        await b.expectId(ctx, 'InstitutionRow.1');
        await b.tapId(ctx, 'InstitutionRow.1');
        await b.expectId(ctx, 'Institution.Page', 10_000);
        await b.expectId(ctx, 'Institution.Accounts');
        await b.tapId(ctx, 'Institution.SettingsButton');
        await b.expectId(ctx, 'BankIntegration.Page', 10_000);
    });

    await b.phase('toggle sync off', async () => {
        await b.expectId(ctx, 'BankIntegration.AccountRow.1');
        await expect(toggle(1)).toBeVisible();
        await expect(toggle(1)).toBeChecked();
        await toggle(1).tap();
        await expect(toggle(1)).not.toBeChecked();
        await openAccountEdit();
        await expect(id('AccountSyncCard.Switch')).not.toBeChecked();
    });

    await b.phase('toggle sync back on', async () => {
        await openIntegration(1);
        await expect(toggle(1)).not.toBeChecked();
        await toggle(1).tap();
        await expect(toggle(1)).toBeChecked();
        await openAccountEdit();
        await expect(id('AccountSyncCard.Switch')).toBeChecked();
    });

    await b.phase('row opens editor, menu opens details', async () => {
        await openIntegration(1);
        await b.expectId(ctx, 'BankIntegration.AccountRow.1');
        await b.tapId(ctx, 'BankIntegration.AccountRow.1');
        await b.expectId(ctx, 'AccountForm.ScrollView', 10_000);
        await back('BankIntegration.Page');
        await b.tapId(ctx, 'BankIntegration.AccountRow.1.Menu');
        await b.expectId(ctx, 'BankIntegration.AccountRow.1.Menu.Details', 3_000);
        await b.expectId(ctx, 'BankIntegration.AccountRow.1.Menu.Edit');
        await b.expectId(ctx, 'BankIntegration.AccountRow.1.Menu.External');
        await b.expectId(ctx, 'BankIntegration.AccountRow.1.Menu.Archive');
        await b.tapId(ctx, 'BankIntegration.AccountRow.1.Menu.Details');
        await b.expectId(ctx, 'AccountDetails.Page', 10_000);
        await back('BankIntegration.Page');
    });

    await b.phase('live integration footer', async () => {
        await b.scrollTo(ctx, 'BankIntegration.AddDepositButton');
        await b.expectId(ctx, 'BankIntegration.AccountRow.15');
        await b.expectId(ctx, 'BankIntegration.AddDepositButton');
        await b.expectNoId(ctx, 'BankIntegration.ImportFileButton');
    });

    await b.phase('file-import integration', async () => {
        await openIntegration(3);
        await b.expectId(ctx, 'BankIntegration.AccountRow.8');
        await expect(toggle(8)).not.toBeChecked();
        await b.expectId(ctx, 'BankIntegration.AccountRow.9');
        await expect(toggle(9)).not.toBeChecked();
        await b.expectId(ctx, 'BankIntegration.ImportFileButton');
        await b.scrollTo(ctx, 'BankIntegration.AddDepositButton');
        await b.expectId(ctx, 'BankIntegration.AddDepositButton');
        await b.tapId(ctx, 'BankIntegration.AddDepositButton');
        await b.expectId(ctx, 'AccountForm.NameInput', 10_000);
        await back('BankIntegration.Page');
    });

    await b.phase('archive from menu', async () => {
        await b.expectId(ctx, 'BankIntegration.AccountRow.9');
        await b.tapId(ctx, 'BankIntegration.AccountRow.9.Menu');
        await b.expectId(ctx, 'BankIntegration.AccountRow.9.Menu.Archive', 3_000);
        await b.tapId(ctx, 'BankIntegration.AccountRow.9.Menu.Archive');
        await b.expectId(ctx, 'BankIntegration.Page', 10_000);
        await b.expectNoId(ctx, 'BankIntegration.AccountRow.9');
        await b.expectId(ctx, 'BankIntegration.AccountRow.8');
    });

    await b.phase('mark external from menu', async () => {
        await b.tapId(ctx, 'BankIntegration.AccountRow.8.Menu');
        await b.expectId(ctx, 'BankIntegration.AccountRow.8.Menu.External', 3_000);
        await b.tapId(ctx, 'BankIntegration.AccountRow.8.Menu.External');
        await b.expectText(ctx, 'Mark as External?');
        await screen.getByText('Mark External').last().tap();
        await b.expectNoId(ctx, 'BankIntegration.AccountRow.8', 10_000);
        await b.expectId(ctx, 'BankIntegration.Page');
    });
});
