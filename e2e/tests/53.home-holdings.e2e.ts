import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('53 home holdings hide empty assets', { tags: ['crypto'] }, async ({ budgie }) => {
    const { ctx } = budgie;
    const { screen } = ctx;

    await budgie.start({ fixture: '53-home-holdings.db' });

    await b.phase('zero and dust holdings stay off Home', async () => {
        await b.expectId(ctx, 'HomeHolding.BTC', 10_000);
        await b.expectId(ctx, 'HomeHolding.ETH');
        await b.expectNoId(ctx, 'HomeHolding.DOT');
        await b.expectNoId(ctx, 'HomeHolding.FDUSD');
    });

    await b.phase('the exchange counts only the assets it shows', async () => {
        await b.scrollToCentered(ctx, 'InstitutionRow.1');
        await expect(b.byId(screen, 'InstitutionRow.1')).toHaveText(/2 assets/);
        await b.tapId(ctx, 'InstitutionRow.1');
        await b.expectId(ctx, 'Institution.Page', 10_000);
        await b.expectId(ctx, 'AccountCard.E2E Binance DOT');
    });
});
