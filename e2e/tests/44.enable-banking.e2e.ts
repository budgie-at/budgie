import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as i from '../support/budgie/imports.ts';
import { test } from '../support/budgie/test.ts';

const NOT_A_KEY = 'This file is not an unencrypted RSA private key in PEM format.';

test('44 enable banking', { tags: ['sync'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const openIntegration = async (n: number, title: string) => {
        await b.openLink(ctx, `budgie://bank-integration/${n}`);
        await b.expectId(ctx, 'BankIntegration.Page', 10_000);
        await b.expectText(ctx, title);
    };
    const pickInvalidKey = async (rowId: string) => {
        await b.tapId(ctx, rowId);
        await i.selectFileFromAppProvider(ctx, 'e2e-budgie-import, csv');
        await b.expectText(ctx, NOT_A_KEY, 10_000);
    };

    await budgie.start({ fixture: '44-enable-banking.db' });

    await b.phase('setup guide and key step', async () => {
        await b.openLink(ctx, 'budgie://create-account');
        await b.scrollTo(ctx, 'CreateAccount.ENABLE_BANKING');
        await b.tapId(ctx, 'CreateAccount.ENABLE_BANKING');
        await b.expectText(ctx, 'Set up once, about 5 minutes', 10_000);
        await b.tapId(ctx, 'CreateEnableBankingAccount.ContinueButton');
        await b.expectId(ctx, 'EnableBankingKeyStep.Terms', 10_000);
        await b.expectId(ctx, 'EnableBankingKeyStep.ChooseKeyFile');
    });

    await b.phase('invalid key file is rejected', async () => {
        await pickInvalidKey('EnableBankingKeyStep.ChooseKeyFile');
        await b.expectText(ctx, 'Choose key file');
        await expect(id('CreateEnableBankingAccount.ContinueButton')).toBeDisabled();
    });

    await b.phase('valid consent', async () => {
        await openIntegration(91, 'E2E Valid Bank');
        await b.expectText(ctx, 'Consent valid until');
        await b.expectId(ctx, 'BankIntegration.AccountRow.910');
        await b.expectId(ctx, 'BankIntegration.AccountRow.911');
        await b.expectNoId(ctx, 'EnableBankingConnectionCard.Reauthorize');
        await b.expectNoId(ctx, 'EnableBankingConnectionCard.ChooseKey');
    });

    await b.phase('expired consent', async () => {
        await openIntegration(92, 'E2E Expired Bank');
        await b.expectText(ctx, 'Consent expired');
        await b.expectId(ctx, 'EnableBankingConnectionCard.Reauthorize');
        await b.expectText(ctx, 'Renews bank consent for syncing.');
        await b.expectNoId(ctx, 'EnableBankingConnectionCard.ChooseKey');
    });

    await b.phase('account not linked', async () => {
        await openIntegration(93, 'E2E Unlinked Bank');
        await b.expectId(ctx, 'EnableBankingConnectionCard.Reauthorize');
        await b.expectText(ctx, 'An account is not linked. Link it in Enable Banking, then authorize.');
    });

    await b.phase('key missing offers re-pick', async () => {
        await openIntegration(94, 'E2E Keyless Bank');
        await b.expectText(ctx, 'The key is missing or was rejected.');
        await b.expectNoId(ctx, 'EnableBankingConnectionCard.Reauthorize');
        await pickInvalidKey('EnableBankingConnectionCard.ChooseKey');
        await b.expectId(ctx, 'EnableBankingConnectionCard.ChooseKey');
    });

    await b.phase('disconnect archives the accounts', async () => {
        await openIntegration(91, 'E2E Valid Bank');
        await b.scrollTo(ctx, 'EnableBankingConnectionCard.Disconnect');
        await b.tapId(ctx, 'EnableBankingConnectionCard.Disconnect');
        await b.expectText(ctx, 'Disconnect this bank?');
        await screen.getByText('Disconnect').last().tap();
        await b.expectText(ctx, 'Disconnected on this phone', 15_000);
        await b.expectText(ctx, 'The consent stays valid at your bank until it expires.');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await a.openArchivedAccounts(ctx);
        await b.expectId(ctx, 'ArchivedAccountCard.E2E Valid Bank Current');
        await b.expectId(ctx, 'ArchivedAccountCard.E2E Valid Bank Savings');
        await b.expectNoId(ctx, 'ArchivedAccountCard.E2E Expired Bank Current');
        await b.openLink(ctx, 'budgie://bank-integration/91');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await b.expectNoId(ctx, 'BankIntegration.Page');
    });
});
