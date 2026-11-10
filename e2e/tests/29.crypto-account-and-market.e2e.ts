import { expect } from 'e2e';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('29 crypto account and market', { tags: ['crypto'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const ids = async (...testIds: string[]) => {
        for (const testId of testIds) {
            await b.expectId(ctx, testId);
        }
    };
    const backHome = async () => {
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'HomePage.TotalBalance', 3_000);
    };
    const runwaySwitch = (name: 'Pill' | 'Crypto') => id(`SettingsPage.Runway${name}Switch`);
    const scrollToComposition = () => screen.scrollUntilVisible(id('NetWorthComposition'), { direction: 'up', timeout: 20_000 });

    await budgie.start({ fixture: '29.db' });

    await b.phase('home crypto group', async () => {
        await b.expectId(ctx, 'CryptoGroup.Market.BTC', 10_000);
        await ids('CryptoGroup.Card.BTC', 'CryptoGroup.Container.BTC', 'NetWorthComposition');
        await ids(
            'CryptoGroup.Balance.BTC',
            'CryptoGroup.Value.BTC',
            'CryptoGroup.Toggle.BTC',
            'CryptoGroup.AccountCount.BTC',
            'CryptoGroup.Rate.BTC'
        );
        await b.expectId(ctx, 'CryptoGroup.Market.ETH', 10_000);
        await ids(
            'CryptoGroup.Card.ETH',
            'CryptoGroup.Container.ETH',
            'CryptoGroup.Balance.ETH',
            'CryptoGroup.Value.ETH',
            'CryptoGroup.Toggle.ETH',
            'CryptoGroup.AccountCount.ETH',
            'CryptoGroup.Rate.ETH'
        );
        await b.tapId(ctx, 'CryptoGroup.Toggle.BTC');
        await b.scrollToCentre(ctx, 'AccountCard.Balance.E2E_Crypto_Vault.2_BTC');
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Crypto_Vault.2_BTC');
    });

    await b.phase('binance accounts under their integration', async () => {
        await screen.scrollUntilVisible(id('AccountCard.E2E Binance BTC'), { direction: 'down', timeout: 10_000 });
        await ids('AccountCard.E2E Binance BTC', 'AccountCard.Balance.E2E_Binance_BTC.2_BTC');
    });

    await b.phase('binance credentials editor', async () => {
        await a.openAccountSettings(ctx, 'E2E Binance BTC');
        await screen.scrollUntilVisible(id('SyncTokenSection.ChangeButton'), { direction: 'down', timeout: 3_000 });
        await b.expectNoId(ctx, 'SyncTokenSection.TokenLabel');
        await b.tapId(ctx, 'SyncTokenSection.ChangeButton');
        await b.expectId(ctx, 'SyncTokenSection.BinanceApiKeyInput', 3_000);
        await b.expectId(ctx, 'SyncTokenSection.BinanceApiSecretInput');
        await b.expectNoId(ctx, 'SyncTokenSection.MonobankPasteButton');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'AccountDetails.Page', 3_000);
        await backHome();
    });

    await b.phase('BTC market page', async () => {
        await b.tapId(ctx, 'CryptoGroup.Market.BTC');
        await b.expectId(ctx, 'CurrencyMarket.Header.BTC', 10_000);
        await ids('CurrencyMarket.Price.BTC', 'CurrencyMarket.Change.BTC', 'CurrencyMarket.Sparkline.BTC');
        await b.tapId(ctx, 'CurrencyMarket.Range.YEAR');
        await ids(
            'CurrencyMarket.Sparkline.BTC',
            'CurrencyMarket.Holdings.BTC',
            'CurrencyMarket.Holdings.Balance.BTC',
            'CurrencyMarket.Holdings.Value.BTC',
            'CurrencyMarket.Holdings.UnrealizedProfit.BTC'
        );
        await b.expectText(ctx, '4 BTC');
        await screen.scrollUntilVisible(id('CurrencyMarket.Account.BTC.2'), { direction: 'down', timeout: 3_000 });
        await b.expectId(ctx, 'CurrencyMarket.Account.BTC.2');
        await screen.scrollUntilVisible(id('CurrencyMarket.MarketCap.BTC'), { direction: 'down', timeout: 3_000 });
        await ids('CurrencyMarket.DailyChange.BTC', 'CurrencyMarket.Volume.BTC', 'CurrencyMarket.Updated.BTC');
        await backHome();
    });

    await b.phase('ETH market page', async () => {
        await b.tapId(ctx, 'CryptoGroup.Toggle.BTC');
        await b.expectNoId(ctx, 'AccountCard.E2E Crypto Vault', 5_000);
        await b.expectId(ctx, 'CryptoGroup.Market.ETH', 5_000);
        await b.expectSettledId(ctx, 'CryptoGroup.Market.ETH');
        // The collapsed ETH row ends under the floating tab bar, whose Settings tab covers the row's centre: tap its top edge.
        await id('CryptoGroup.Market.ETH').tap({ position: { x: 185, y: 12 } });
        await b.expectId(ctx, 'CurrencyMarket.Header.ETH', 10_000);
        await ids(
            'CurrencyMarket.Price.ETH',
            'CurrencyMarket.Sparkline.ETH',
            'CurrencyMarket.Holdings.ETH',
            'CurrencyMarket.Holdings.Balance.ETH',
            'CurrencyMarket.Holdings.Value.ETH'
        );
        await b.expectText(ctx, '1 ETH');
        await b.scrollTo(ctx, 'CurrencyMarket.MarketCap.ETH');
        await ids('CurrencyMarket.Volume.ETH', 'CurrencyMarket.Updated.ETH');
        await backHome();
    });

    await b.phase('crypto income from account details', async () => {
        if (!(await id('AccountCard.E2E Crypto Vault').isVisible())) {
            await b.tapId(ctx, 'CryptoGroup.Toggle.BTC');
        }
        await b.scrollToCentre(ctx, 'AccountCard.Balance.E2E_Crypto_Vault.2_BTC');
        // A tap while the centring swipe still glides only stops the list: tap again if details did not open.
        await b.tapUntil(ctx, 'AccountCard.Balance.E2E_Crypto_Vault.2_BTC', () => b.expectId(ctx, 'AccountDetails.ActionsButton', 5_000));
        await ids('AccountDetails.ConvertedValue', 'AccountDetails.MarketLink');
        await b.tapId(ctx, 'AccountDetails.MarketLink');
        await b.expectId(ctx, 'CurrencyMarket.Header.BTC', 10_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
        await b.expectId(ctx, 'TransactionCard.Badge.Adjustment', 10_000);
        await b.expectId(ctx, 'TransactionCard.AdjustmentAmount.2');
        await t.openTransactionForm(ctx, 'ActionItem.Income', 'New Income');
        await b.tapId(ctx, 'TransactionKeypad.Digit.1');
        await c.createCategoryFromTransaction(ctx, 'E2E Crypto Buy');
        await t.enterComment(ctx, 'E2E Crypto Income');
        await b.tapId(ctx, 'TransactionForm.SubmitButton');
        await b.expectId(ctx, 'AccountDetails.ActionsButton', 10_000);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Crypto_Income', 10_000);
        await b.expectId(ctx, 'TransactionCard.Category.E2E_Crypto_Buy');
        await backHome();
    });

    await b.phase('updated market holdings', async () => {
        await b.tapId(ctx, 'CryptoGroup.Market.BTC');
        await b.expectId(ctx, 'CurrencyMarket.Header.BTC', 10_000);
        await b.expectText(ctx, '5 BTC');
        await b.expectId(ctx, 'CurrencyMarket.Holdings.UnrealizedProfit.BTC');
        await backHome();
    });

    await b.phase('runway pill and verdict, fiat only', async () => {
        try {
            await scrollToComposition();
        } catch {
            // optional: true in the flow
        }
        await b.expectId(ctx, 'RunwayPill');
        await b.tapId(ctx, 'RunwayPill');
        await b.expectId(ctx, 'RunwayVerdict.Figure._3', 10_000);
        await b.expectNoId(ctx, 'RunwayVerdict.CryptoNote');
    });

    await b.phase('runway settings: include crypto', async () => {
        await b.openLink(ctx, 'budgie://settings?anchor=runway');
        await b.expectId(ctx, 'SettingsPage.RunwayCryptoCard', 10_000);
        await expect(runwaySwitch('Pill')).toHaveValue('1');
        await expect(runwaySwitch('Crypto')).toHaveValue('0');
        await runwaySwitch('Crypto').tap();
        await expect(runwaySwitch('Crypto')).toHaveValue('1', { timeout: 3_000 });
        await b.openLink(ctx, 'budgie://analytics?tab=runway');
        await b.expectId(ctx, 'RunwayVerdict.Figure._15', 10_000);
        await b.expectId(ctx, 'RunwayVerdict.CryptoNote');
    });

    await b.phase('runway pill hidden, then shown again', async () => {
        await b.openLink(ctx, 'budgie://settings?anchor=runway');
        await expect(runwaySwitch('Pill')).toHaveValue('1', { timeout: 10_000 });
        await runwaySwitch('Pill').tap();
        await expect(runwaySwitch('Pill')).toHaveValue('0', { timeout: 3_000 });
        await b.openLink(ctx, 'budgie://');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await scrollToComposition();
        await b.expectNoId(ctx, 'RunwayPill');
        await b.openLink(ctx, 'budgie://settings?anchor=runway');
        await expect(runwaySwitch('Pill')).toHaveValue('0', { timeout: 10_000 });
        await runwaySwitch('Pill').tap();
        await expect(runwaySwitch('Pill')).toHaveValue('1', { timeout: 3_000 });
        await b.openLink(ctx, 'budgie://');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        try {
            await scrollToComposition();
        } catch {
            // optional: true in the flow
        }
        await b.expectId(ctx, 'RunwayPill');
    });
});
