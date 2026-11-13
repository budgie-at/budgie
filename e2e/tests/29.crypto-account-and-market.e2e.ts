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

    await b.phase('home crypto holdings', async () => {
        await b.expectId(ctx, 'HomeHolding.BTC', 10_000);
        await ids('HomeHolding.Caption.BTC', 'HomeHolding.Value.BTC', 'NetWorthComposition');
        await expect(id('HomeHolding.Caption.BTC')).toHaveText(/^4 BTC · .*2 wallets$/);
        await b.expectId(ctx, 'HomeHolding.ETH', 10_000);
        await ids('HomeHolding.Caption.ETH', 'HomeHolding.Value.ETH');
        await b.expectNoId(ctx, 'AccountCard.E2E Crypto Vault');
    });

    await b.phase('binance exchange row opens its institution', async () => {
        await b.scrollToCentered(ctx, 'InstitutionRow.1');
        await expect(id('InstitutionRow.1')).toHaveText(/Fiat · 1 asset/);
        await b.tapId(ctx, 'InstitutionRow.1');
        await b.expectId(ctx, 'Institution.Page', 10_000);
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
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'Institution.Page', 3_000);
        await backHome();
    });

    await b.phase('BTC market page', async () => {
        await b.tapId(ctx, 'HomeHolding.BTC');
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
        await screen.scrollUntilVisible(id('CurrencyMarket.Account.BTC.3'), { direction: 'down', timeout: 3_000 });
        await b.expectId(ctx, 'CurrencyMarket.Account.BTC.2');
        await screen.scrollUntilVisible(id('CurrencyMarket.MarketCap.BTC'), { direction: 'down', timeout: 3_000 });
        await ids('CurrencyMarket.DailyChange.BTC', 'CurrencyMarket.Volume.BTC', 'CurrencyMarket.Updated.BTC');
        await backHome();
    });

    await b.phase('ETH market page', async () => {
        await b.scrollToCentered(ctx, 'HomeHolding.ETH');
        await b.tapUntil(ctx, 'HomeHolding.ETH', () => b.expectId(ctx, 'CurrencyMarket.Header.ETH', 10_000));
        await ids(
            'CurrencyMarket.Price.ETH',
            'CurrencyMarket.Sparkline.ETH',
            'CurrencyMarket.Holdings.ETH',
            'CurrencyMarket.Holdings.Balance.ETH',
            'CurrencyMarket.Holdings.Value.ETH'
        );
        await b.expectText(ctx, '1 ETH');
        await b.scrollTo(ctx, 'CurrencyMarket.Updated.ETH');
        await ids('CurrencyMarket.MarketCap.ETH', 'CurrencyMarket.Volume.ETH');
        await backHome();
    });

    await b.phase('crypto income from account details', async () => {
        await b.scrollToCentered(ctx, 'HomeHolding.BTC');
        await b.tapUntil(ctx, 'HomeHolding.BTC', () => b.expectId(ctx, 'CurrencyMarket.Header.BTC', 10_000));
        await screen.scrollUntilVisible(id('CurrencyMarket.Account.BTC.2'), { direction: 'down', timeout: 3_000 });
        await b.tapUntil(ctx, 'CurrencyMarket.Account.BTC.2', () => b.expectId(ctx, 'AccountDetails.ActionsButton', 5_000));
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
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'CurrencyMarket.Header.BTC', 10_000);
        await backHome();
    });

    await b.phase('updated market holdings', async () => {
        await b.scrollToCentered(ctx, 'HomeHolding.BTC');
        await b.tapUntil(ctx, 'HomeHolding.BTC', () => b.expectId(ctx, 'CurrencyMarket.Header.BTC', 10_000));
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
        await b.expectSwitch(ctx, runwaySwitch('Pill'), true);
        await b.expectSwitch(ctx, runwaySwitch('Crypto'), false);
        await runwaySwitch('Crypto').tap();
        await b.expectSwitch(ctx, runwaySwitch('Crypto'), true, 3_000);
        await b.openLink(ctx, 'budgie://analytics?tab=runway');
        await b.expectId(ctx, 'RunwayVerdict.Figure._15', 10_000);
        await b.expectId(ctx, 'RunwayVerdict.CryptoNote');
    });

    await b.phase('runway pill hidden, then shown again', async () => {
        await b.openLink(ctx, 'budgie://settings?anchor=runway');
        await b.expectSwitch(ctx, runwaySwitch('Pill'), true, 10_000);
        await runwaySwitch('Pill').tap();
        await b.expectSwitch(ctx, runwaySwitch('Pill'), false, 3_000);
        await b.openLink(ctx, 'budgie://');
        await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await scrollToComposition();
        await b.expectNoId(ctx, 'RunwayPill');
        await b.openLink(ctx, 'budgie://settings?anchor=runway');
        await b.expectSwitch(ctx, runwaySwitch('Pill'), false, 10_000);
        await runwaySwitch('Pill').tap();
        await b.expectSwitch(ctx, runwaySwitch('Pill'), true, 3_000);
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
