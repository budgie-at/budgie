import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { AccountBalanceEntityTable, AccountTypeEnum, ExchangeRateEntityTable, PRECISION } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { seed, seedBitcoinCryptoAccount } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';

const BITCOIN_EURO_RATE = 50_000;
const BITCOIN_BALANCE = 2 * PRECISION;
const CASH_BALANCE = 3_000 * PRECISION;
const BITCOIN_EURO_VALUE = BITCOIN_BALANCE * BITCOIN_EURO_RATE;

const seedLiquidFixture = async () => {
    const { bitcoin, euro } = await seedBitcoinCryptoAccount(BITCOIN_BALANCE);
    const cashAccount = seed.account({ instrumentId: euro.id, type: AccountTypeEnum.CASH });

    insertOne(AccountBalanceEntityTable, { accountId: cashAccount.id, amount: CASH_BALANCE });
    insertOne(ExchangeRateEntityTable, {
        source: 'test',
        baseInstrumentId: bitcoin.id,
        quoteInstrumentId: euro.id,
        rate: BITCOIN_EURO_RATE
    });

    return euro;
};

describe('runway/liquid-total-crypto', () => {
    it('excludes crypto accounts from the liquid total by default', async () => {
        const euro = await seedLiquidFixture();

        const liquidTotal = accountBalanceRepository.getLiquidTotal(euro.id, false).get();

        expect(liquidTotal?.total).toBe(CASH_BALANCE);
    });

    it('adds crypto accounts at market value when crypto is included', async () => {
        const euro = await seedLiquidFixture();

        const liquidTotal = accountBalanceRepository.getLiquidTotal(euro.id, true).get();

        expect(liquidTotal?.total).toBe(CASH_BALANCE + BITCOIN_EURO_VALUE);
    });
});
