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
    const saveTrade = async (destinationId: string) => {
        await expect(core.byId(screen, 'Brokerage.SaveButton')).toBeEnabled({ timeout: 3_000 });
        await core.tapId(ctx, 'Brokerage.SaveButton');
        await core.expectId(ctx, destinationId, 15_000);
    };

    await budgie.start({ fixture: '01.db' });

    await core.phase('create a manual brokerage with cash', async () => {
        await accounts.openNewAccount(ctx);
        await core.scrollTo(ctx, 'CreateAccount.STOCKS');
        await core.tapUntil(ctx, 'CreateAccount.STOCKS', () => core.expectId(ctx, 'AccountForm.NameInput', 3_000));
        await core.fillId(ctx, 'AccountForm.NameInput', 'E2E Broker');
        await core.fillId(ctx, 'CreateAccount.Amount', '2000');
        await core.tapId(ctx, 'AccountForm.NameInput.Label');
        await core.tapUntil(ctx, 'AccountForm.SubmitButton', () => core.expectId(ctx, 'HomePage.TotalBalance', 15_000));
        await core.scrollTo(ctx, 'InstitutionRow.E2E Broker');
        await core.expectSettledId(ctx, 'InstitutionRow.E2E Broker');
        await core.tapId(ctx, 'InstitutionRow.E2E Broker');
        await core.expectId(ctx, 'Institution.Page', 10_000);
    });

    await core.phase('add a position found by ticker', async () => {
        await core.scrollTo(ctx, 'Brokerage.AddPositionButton');
        await core.tapId(ctx, 'Brokerage.AddPositionButton');
        await core.expectId(ctx, 'Brokerage.TradePage', 10_000);
        await core.fillId(ctx, 'Brokerage.SearchInput', 'BGTX');
        await core.done(ctx);
        await core.expectId(ctx, 'Brokerage.Listing.BGTX', 15_000);
        await core.tapId(ctx, 'Brokerage.Listing.BGTX');
        await typeDigits('Brokerage.QuantityInput', '10');
        await typeDigits('Brokerage.PriceInput', '100');
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
        await expect(core.byId(screen, 'InstitutionRow.E2E Broker')).toHaveText(/\$2,200/, { timeout: 10_000 });
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
        await expect(core.byId(screen, 'Brokerage.QuantityError')).toHaveText(/Only 10 shares held/, { timeout: 3_000 });
        await expect(core.byId(screen, 'Brokerage.SaveButton')).toBeDisabled();
        await core.fillId(ctx, 'Brokerage.QuantityInput', '4');
        await core.done(ctx);
        await typeDigits('Brokerage.PriceInput', '125');
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
});
