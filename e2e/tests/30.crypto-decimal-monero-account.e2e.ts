// Port of tests/app-tests/flows/30.crypto-decimal-monero-account.flow.yaml.
import * as a from '../support/budgie/accounts.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('30 crypto decimal monero account', { tags: ['accounts'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '02.db' });

    await b.phase('create monero account', () =>
        a.createCryptoAccount(ctx, { name: 'E2E Monero Ledger', amount: '22.123456', currency: 'XMR' })
    );

    await b.phase('crypto group', async () => {
        await b.expectId(ctx, 'CryptoGroup.Market.XMR', 10_000);
        for (const part of ['Card', 'Container', 'Balance', 'Value', 'Rate']) {
            await b.expectId(ctx, `CryptoGroup.${part}.XMR`);
        }
        await b.tapId(ctx, 'CryptoGroup.AccountCount.XMR');
        await b.expectId(ctx, 'AccountCard.E2E Monero Ledger', 10_000);
        await b.expectId(ctx, 'AccountCard.Balance.E2E_Monero_Ledger.22_123456_XMR');
    });

    await b.phase('market holdings', async () => {
        await b.tapId(ctx, 'CryptoGroup.Market.XMR');
        await b.expectId(ctx, 'CurrencyMarket.Holdings.XMR', 10_000);
        await b.expectText(ctx, /^22\.123456 XMR$/i);
    });
});
