import { expect } from 'e2e';

import * as accounts from '../support/budgie/accounts.ts';
import * as core from '../support/budgie/core.ts';
import { PENDING_ANDROID_PORT, test } from '../support/budgie/test.ts';

test('51 manual brokerage with stocks', { tags: ['accounts'], platforms: PENDING_ANDROID_PORT }, async ({ budgie }) => {
    const { ctx } = budgie;
    const { screen } = ctx;
    const position = 'AccountCard.Budgie Example Holdings';
    const typeDigits = async (testId: string, digits: string) => {
        await core.scrollTo(ctx, testId);
        await core.tapId(ctx, testId);
        await core.expectId(ctx, 'inputView');
        for (const digit of digits) {
            await screen.getByText(digit, { exact: true }).last().tap();
        }
        await expect(core.byId(screen, testId)).toHaveValue(digits);
        await core.done(ctx);
    };
    const replaceDigits = async (testId: string, digits: string) => {
        await core.scrollTo(ctx, testId);
        await core.fillId(ctx, testId, digits);
        await expect(core.byId(screen, testId)).toHaveValue(digits);
        await core.done(ctx);
    };
    const pickSecurity = async (symbol: string) => {
        await core.scrollTo(ctx, 'Brokerage.AddPositionButton');
        await core.tapId(ctx, 'Brokerage.AddPositionButton');
        await core.expectSettledId(ctx, 'Brokerage.SearchInput');
        await core.fillId(ctx, 'Brokerage.SearchInput', symbol);
        await core.expectId(ctx, `Brokerage.Listing.${symbol}`, 15_000);
        await core.tapId(ctx, `Brokerage.Listing.${symbol}`);
        await core.expectId(ctx, 'Brokerage.TradePage', 10_000);
        await core.expectId(ctx, 'Brokerage.SecurityButton');
    };
    const saveTrade = async (destinationId: string) => {
        await expect(core.byId(screen, 'Brokerage.SaveButton')).toBeEnabled({ timeout: 3_000 });
        await core.tapId(ctx, 'Brokerage.SaveButton');
        await core.expectId(ctx, destinationId, 15_000);
    };

    await budgie.start({ fixture: '01.db' });

    await core.phase('create a manual brokerage', async () => {
        await accounts.openNewAccount(ctx);
        await core.scrollTo(ctx, 'CreateAccount.STOCKS');
        await core.tapUntil(ctx, 'CreateAccount.STOCKS', () => core.expectId(ctx, 'AccountForm.NameInput', 3_000));
        await core.fillId(ctx, 'AccountForm.NameInput', 'E2E Broker');
        await core.tapId(ctx, 'AccountForm.NameInput.Label');
        await core.tapUntil(ctx, 'AccountForm.SubmitButton', () => core.expectId(ctx, 'HomePage.TotalBalance', 15_000));
        await core.scrollTo(ctx, 'InstitutionRow.E2E Broker');
        await core.expectSettledId(ctx, 'InstitutionRow.E2E Broker');
        await core.tapId(ctx, 'InstitutionRow.E2E Broker');
        await core.expectId(ctx, 'Institution.Page', 10_000);
        await core.expectText(ctx, 'No positions yet');
    });

    await core.phase('add a position found by ticker', async () => {
        await pickSecurity('BGTX');
        await expect(core.byId(screen, 'Brokerage.PriceInput')).toHaveValue('120', { timeout: 10_000 });
        await typeDigits('Brokerage.QuantityInput', '10');
        await replaceDigits('Brokerage.PriceInput', '100');
        await expect(core.byId(screen, 'Brokerage.TradeTotal')).toHaveText(/\$1,000/, { timeout: 3_000 });
        await saveTrade('Institution.Page');
    });

    await core.phase('the position is valued on the brokerage and on Home', async () => {
        await core.scrollTo(ctx, position);
        await expect(core.byId(screen, position)).toHaveText(/10 BGTX, worth \$1,200/, { timeout: 30_000 });
        await core.scrollTo(ctx, 'Brokerage.GainLine', 'up');
        await expect(core.byId(screen, 'Brokerage.GainLine')).toHaveText(/\+\$200/, { timeout: 10_000 });
        await core.tapId(ctx, 'PageHeader.BackButton');
        await core.expectId(ctx, 'HomePage.TotalBalance', 10_000);
        await core.scrollTo(ctx, 'InstitutionRow.E2E Broker');
        await expect(core.byId(screen, 'InstitutionRow.E2E Broker')).toHaveText(/\$1,200/, { timeout: 10_000 });
    });

    await core.phase('sell part of the position', async () => {
        await core.tapId(ctx, 'InstitutionRow.E2E Broker');
        await core.expectId(ctx, 'Institution.Page', 10_000);
        await core.scrollTo(ctx, position);
        await core.tapUntil(ctx, position, () => core.expectId(ctx, 'AccountDetails.Page', 10_000));
        await core.tapUntil(ctx, 'AccountDetails.ActionsButton', () => core.expectId(ctx, 'Brokerage.SellButton', 5_000));
        await core.tapId(ctx, 'Brokerage.SellButton');
        await core.expectId(ctx, 'Brokerage.TradePage', 10_000);
        await typeDigits('Brokerage.QuantityInput', '40');
        await expect(core.byId(screen, 'Brokerage.QuantityHint')).toHaveText(/Only 10 shares held/, { timeout: 3_000 });
        await expect(core.byId(screen, 'Brokerage.SaveButton')).toBeDisabled();
        await core.fillId(ctx, 'Brokerage.QuantityInput', '4');
        await core.done(ctx);
        await expect(core.byId(screen, 'Brokerage.QuantityHint')).toHaveText(/Up to 10 shares/, { timeout: 3_000 });
        await expect(core.byId(screen, 'Brokerage.PriceInput')).toHaveValue('120', { timeout: 10_000 });
        await replaceDigits('Brokerage.PriceInput', '125');
        await expect(core.byId(screen, 'Brokerage.TradeTotal')).toHaveText(/\$500/, { timeout: 3_000 });
        await saveTrade('AccountDetails.Page');
    });

    await core.phase('the market screen shows the realized return', async () => {
        await core.expectId(ctx, 'AccountDetails.MarketLink', 10_000);
        await core.tapId(ctx, 'AccountDetails.MarketLink');
        await core.expectId(ctx, 'CurrencyMarket.Header.BGTX', 10_000);
        await core.expectText(ctx, '6 BGTX');
        await core.scrollTo(ctx, 'CurrencyMarket.Holdings.RealizedProfit.BGTX');
        await core.expectText(ctx, '+$100', 10_000);
    });

    await core.phase('a euro-quoted listing shows its price change in euros', async () => {
        await core.openLink(ctx, 'budgie://institution/1');
        await core.expectId(ctx, 'Institution.Page', 10_000);
        await expect(screen.getByRole('button', { name: /^Sell BGTX, 4 BGTX @ \$125, \+\$500/ }).first()).toBeVisible({ timeout: 10_000 });
        await pickSecurity('BGEU');
        await typeDigits('Brokerage.QuantityInput', '1');
        await replaceDigits('Brokerage.PriceInput', '100');
        await saveTrade('Institution.Page');
        await core.scrollTo(ctx, 'AccountCard.Budgie Euro Fund');
        await core.tapUntil(ctx, 'AccountCard.Budgie Euro Fund', () => core.expectId(ctx, 'AccountDetails.Page', 10_000));
        await core.tapId(ctx, 'AccountDetails.MarketLink');
        await core.expectId(ctx, 'CurrencyMarket.Header.BGEU', 10_000);
        await core.expectText(ctx, /\+€18\.00/, 10_000);
        await core.scrollTo(ctx, 'CurrencyMarket.Holdings.Value.BGEU');
        await core.expectText(ctx, /At €120\.00 ≈ \$/, 10_000);
    });
});
