import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('43 binance sync error', { tags: ['sync'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    await budgie.start({ fixture: 'sync-binance-error.db' });

    await b.phase('account sync card shows the region error', async () => {
        await b.openLink(ctx, 'budgie://account/90/update');
        await b.expectId(ctx, 'AccountForm.ScrollView', 10_000);
        await screen.scrollUntilVisible(b.byId(screen, 'AccountSyncCard.Warning'), { direction: 'down', timeout: 5_000 });
        await expect(b.byId(screen, 'AccountSyncCard.Warning')).toHaveText(/^Binance is not available in your region/i);
        await expect(b.byId(screen, 'AccountSyncCard.Status')).toHaveText(/^Sync failed$/i);
        await b.expectNoId(ctx, 'AccountSyncCard.LastError');
    });

    await b.phase('create binance account lists unsynced products', async () => {
        await b.openLink(ctx, 'budgie://create-account/BINANCE');
        await b.expectId(ctx, 'CreateBinanceAccount.ScrollView', 10_000);
        await screen.scrollUntilVisible(b.byText(screen, /^Not synced: Auto-Invest/i), { direction: 'down', timeout: 5_000 });
    });
});
