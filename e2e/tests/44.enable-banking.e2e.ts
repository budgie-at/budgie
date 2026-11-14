import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import * as i from '../support/budgie/imports.ts';
import { test } from '../support/budgie/test.ts';

const NOT_A_KEY = 'This file is not an unencrypted RSA private key in PEM format.';
const THROWAWAY_KEY = 'e2e00000-0000-4000-8000-0000000000e1.pem, txt';
const SYNTHETIC_ACCOUNT = 'E2E Synthetic Bank E2E Current';
const CONNECT_ACCOUNT = 'E2E Statement Account';
const CONNECT_ACCOUNT_ID = 960;
const WISE_EUR_ACCOUNT = 'Wise EUR';
const WISE_USD_ACCOUNT = 'Wise USD';
const WISE_INSTITUTION_ROW = 'InstitutionRow.96';

test('44 enable banking', { tags: ['sync'], platforms: ['ios'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const openIntegration = async (n: number, title: string) => {
        await b.openLink(ctx, `budgie://bank-integration/${n}`);
        await b.expectId(ctx, 'BankIntegration.Page', 10_000);
        await b.expectText(ctx, title);
    };
    const pickFile = async (rowId: string, file: string) => {
        await b.tapId(ctx, rowId);
        await i.selectFileFromAppProvider(ctx, file);
    };
    const pickInvalidKey = async (rowId: string) => {
        await pickFile(rowId, 'e2e-budgie-import, csv');
        await b.expectText(ctx, NOT_A_KEY, 10_000);
    };

    await budgie.start({ fixture: '44-enable-banking.db' });

    await b.phase('setup guide and key step', async () => {
        await b.openLink(ctx, 'budgie://create-account');
        await b.scrollTo(ctx, 'CreateAccount.MoreBanks');
        await b.tapId(ctx, 'CreateAccount.MoreBanks');
        await b.expectId(ctx, 'EnableBankingBankRow.E2E Synthetic Bank', 15_000);
        await b.tapId(ctx, 'EnableBankingBankRow.E2E Synthetic Bank');
        await b.expectText(ctx, 'Set up once, about 5 minutes', 10_000);
        await b.tapId(ctx, 'CreateEnableBankingAccount.ContinueButton');
        await b.expectId(ctx, 'EnableBankingKeyStep.Terms', 10_000);
        await b.expectId(ctx, 'EnableBankingKeyStep.ChooseKeyFile');
    });

    await b.phase('invalid key file is rejected', async () => {
        await pickInvalidKey('EnableBankingKeyStep.ChooseKeyFile');
        await expect(id('EnableBankingKeyStep.ChooseKeyFile')).toHaveText(/^Choose key file/);
        await expect(id('CreateEnableBankingAccount.ContinueButton')).toBeDisabled();
    });

    await b.phase('connect a synthetic bank through the real flow', async () => {
        await pickFile('EnableBankingKeyStep.ChooseKeyFile', THROWAWAY_KEY);
        await expect(id('EnableBankingKeyStep.ChooseKeyFile')).toHaveText(/^Key file loaded/);
        await expect(id('CreateEnableBankingAccount.ContinueButton')).toBeEnabled();
        await b.tapId(ctx, 'CreateEnableBankingAccount.ContinueButton');
        await b.expectText(ctx, 'Choose accounts', 30_000);
        const account = screen.getByRole('switch', { name: /^E2E Synthetic Bank E2E Current, EUR/ }).first();
        await expect(account).toBeVisible();
        await expect(id('CreateEnableBankingAccount.ContinueButton')).toBeEnabled();
        await b.tapId(ctx, 'CreateEnableBankingAccount.ContinueButton');
        await b.expectId(ctx, 'SyncHistoryDepthOption.FULL', 10_000);
        await b.tapId(ctx, 'CreateEnableBankingAccount.StartSyncButton');
        await b.expectId(ctx, 'HomePage.TotalBalance', 30_000);
        await b.scrollTo(ctx, `AccountCard.${SYNTHETIC_ACCOUNT}`);
        await expect(id(`AccountCard.${SYNTHETIC_ACCOUNT}`)).toHaveText(/€1,235, Up to date$/, { timeout: 90_000 });
        await b.openLink(ctx, 'budgie://transactions');
        await expect(screen.getByRole('button', { name: /^E2E Coffee, €12,.*E2E Synthetic Bank E2E Current$/ }).first()).toBeVisible({
            timeout: 15_000
        });
        await expect(screen.getByRole('button', { name: /^E2E Employer, \+€500,.*E2E Synthetic Bank E2E Current$/ }).first()).toBeVisible();
        await expect(
            screen.getByRole('button', { name: /^Balance Adjustment, \+€747,.*E2E Synthetic Bank E2E Current$/ }).first()
        ).toBeVisible();
    });

    await b.phase('connect Wise from its own row: both balances and the conversion as one transfer', async () => {
        await b.openLink(ctx, 'budgie://create-account');
        await b.scrollTo(ctx, 'CreateAccount.WISE');
        await b.tapId(ctx, 'CreateAccount.WISE');
        await b.expectText(ctx, 'Set up once, about 5 minutes', 10_000);
        await b.tapId(ctx, 'CreateEnableBankingAccount.ContinueButton');
        await pickFile('EnableBankingKeyStep.ChooseKeyFile', THROWAWAY_KEY);
        await expect(id('EnableBankingKeyStep.ChooseKeyFile')).toHaveText(/^Key file loaded/);
        await b.tapId(ctx, 'CreateEnableBankingAccount.ContinueButton');
        await b.expectText(ctx, 'Choose accounts', 30_000);
        await expect(screen.getByRole('switch', { name: /^Wise EUR, EUR/ }).first()).toBeVisible();
        await expect(screen.getByRole('switch', { name: /^Wise USD, USD/ }).first()).toBeVisible();
        await b.tapId(ctx, 'CreateEnableBankingAccount.ContinueButton');
        await b.expectId(ctx, 'SyncHistoryDepthOption.FULL', 10_000);
        await b.tapId(ctx, 'CreateEnableBankingAccount.StartSyncButton');
        await b.expectId(ctx, 'HomePage.TotalBalance', 30_000);
        await b.scrollTo(ctx, WISE_INSTITUTION_ROW, 'up');
        await expect(id(WISE_INSTITUTION_ROW)).toHaveText(/^Enable Banking · Wise, .*2 accounts$/, { timeout: 90_000 });
        await b.tapId(ctx, WISE_INSTITUTION_ROW);
        await expect(id(`AccountCard.${WISE_EUR_ACCOUNT}`)).toHaveText(/€1,000, Up to date$/, { timeout: 90_000 });
        await expect(id(`AccountCard.${WISE_USD_ACCOUNT}`)).toHaveText(/\$108, Up to date$/, { timeout: 90_000 });
        await expect(id('TransactionCard.Label.E2E_Wise_Conversion')).toHaveText(
            /^E2E Wise Conversion, €100, \$108, From Wise EUR to Wise USD$/,
            {
                timeout: 30_000
            }
        );
        await expect(id('TransactionCard.Label.E2E_Other_Bank')).toHaveText(/^E2E Other Bank, \+€1,100,.*Wise EUR$/);
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
        await expect(id('EnableBankingConnectionCard.Reauthorize')).toHaveText(/Renews bank consent for syncing\.$/);
        await b.expectNoId(ctx, 'EnableBankingConnectionCard.ChooseKey');
    });

    await b.phase('account not linked', async () => {
        await openIntegration(93, 'E2E Unlinked Bank');
        await expect(id('EnableBankingConnectionCard.Reauthorize')).toHaveText(
            /An account is not linked\. Link it in Enable Banking, then authorize\.$/
        );
    });

    await b.phase('key missing offers re-pick', async () => {
        await openIntegration(94, 'E2E Keyless Bank');
        await expect(id('EnableBankingConnectionCard.ChooseKey')).toHaveText(/The key is missing or was rejected\.$/);
        await b.expectNoId(ctx, 'EnableBankingConnectionCard.Reauthorize');
        await pickInvalidKey('EnableBankingConnectionCard.ChooseKey');
        await b.expectId(ctx, 'EnableBankingConnectionCard.ChooseKey');
    });

    await b.phase('disconnect archives the accounts', async () => {
        await openIntegration(91, 'E2E Valid Bank');
        await b.scrollTo(ctx, 'EnableBankingConnectionCard.Disconnect');
        await b.tapId(ctx, 'EnableBankingConnectionCard.Disconnect');
        await b.expectText(ctx, 'Disconnect this bank?');
        await screen.getByText('Disconnect').first().tap();
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

    await b.phase('connect an existing account: a saved key skips the key step and a linked bank account is refused inline', async () => {
        await b.openLink(ctx, `budgie://account/${CONNECT_ACCOUNT_ID}/update`);
        await b.scrollTo(ctx, 'AccountConnectBankRow.Row');
        await b.tapId(ctx, 'AccountConnectBankRow.Row');
        await b.expectId(ctx, 'EnableBankingBankRow.E2E Synthetic Bank', 15_000);
        await b.tapId(ctx, 'EnableBankingBankRow.E2E Synthetic Bank');
        await b.expectText(ctx, 'Choose bank account', 30_000);
        await b.expectText(ctx, 'Already linked to another account');
        await expect(id('EnableBankingConnectAccountStep.ConnectButton')).toBeDisabled();
    });

    await b.phase('connect an existing account: history stays, new rows arrive from the day after the last one', async () => {
        await b.openLink(ctx, `budgie://account/${CONNECT_ACCOUNT_ID}/update`);
        await b.scrollTo(ctx, 'AccountConnectBankRow.Row');
        await b.tapId(ctx, 'AccountConnectBankRow.Row');
        await b.expectId(ctx, 'EnableBankingBankRow.E2E Connect Bank', 15_000);
        await b.tapId(ctx, 'EnableBankingBankRow.E2E Connect Bank');
        await b.expectText(ctx, 'Choose bank account', 30_000);
        await expect(id('EnableBankingConnectAccountStep.ConnectButton')).toBeEnabled();
        await b.tapId(ctx, 'EnableBankingConnectAccountStep.ConnectButton');
        await b.expectText(ctx, /^Syncing from /u, 15_000);
        await b.expectNoId(ctx, 'AccountConnectBankRow.Row');
        await b.openLink(ctx, 'budgie://');
        await b.scrollTo(ctx, `AccountCard.${CONNECT_ACCOUNT}`);
        await expect(id(`AccountCard.${CONNECT_ACCOUNT}`)).toHaveText(/€1,235, Up to date$/, { timeout: 90_000 });
        await b.openLink(ctx, 'budgie://transactions');
        await expect(screen.getByRole('button', { name: /^E2E Coffee, €12,.*E2E Statement Account$/ }).first()).toBeVisible({
            timeout: 15_000
        });
        const manualPurchase = screen.getByRole('button', { name: /^E2E Manual Purchase, €7,.*E2E Statement Account$/ }).first();
        await screen.scrollUntilVisible(manualPurchase, { direction: 'down', timeout: 15_000 });
        await expect(manualPurchase).toBeVisible();
    });

    await b.phase('disconnect returns a connected account with its rows and balance', async () => {
        await openIntegration(97, 'E2E Connect Bank');
        await b.scrollTo(ctx, 'EnableBankingConnectionCard.Disconnect');
        await b.tapId(ctx, 'EnableBankingConnectionCard.Disconnect');
        await b.expectText(ctx, 'Disconnect this bank?');
        await screen.getByText('Disconnect').first().tap();
        await b.expectText(ctx, 'Bank disconnected', 15_000);
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await b.scrollTo(ctx, `AccountCard.${CONNECT_ACCOUNT}`);
        await expect(id(`AccountCard.${CONNECT_ACCOUNT}`)).toHaveText(/€1,235/);
        await b.openLink(ctx, `budgie://account/${CONNECT_ACCOUNT_ID}/update`);
        await b.scrollTo(ctx, 'AccountConnectBankRow.Row');
    });

    await b.phase('disconnect the synthetic bank and revoke its session', async () => {
        await openIntegration(95, 'E2E Synthetic Bank');
        await b.scrollTo(ctx, 'EnableBankingConnectionCard.Disconnect');
        await b.tapId(ctx, 'EnableBankingConnectionCard.Disconnect');
        await b.expectText(ctx, 'Disconnect this bank?');
        await screen.getByText('Disconnect').first().tap();
        await b.expectText(ctx, 'Bank disconnected', 15_000);
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await a.openArchivedAccounts(ctx);
        await b.expectId(ctx, `ArchivedAccountCard.${SYNTHETIC_ACCOUNT}`);
    });
});
