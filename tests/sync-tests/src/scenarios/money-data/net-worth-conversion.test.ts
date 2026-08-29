import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { exchangeRatesService } from '@app/exchange-rate/service/exchange-rates.service';
import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    CurrencyEnum,
    ExchangeRateEntityTable,
    PRECISION,
    SettingsEntityTable
} from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { requireInstrument, seedBitcoinCryptoAccount } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

const BITCOIN_EURO_RATE = 50_000;
const CRYPTO_BALANCE_UNITS = 100;
const LIVE_CRYPTO_TOTAL = BITCOIN_EURO_RATE * CRYPTO_BALANCE_UNITS * PRECISION;

const seedHryvniaCashWithBalance = async (balance: number) => {
    const euro = await requireInstrument(CurrencyEnum.EUR);
    const hryvnia = await requireInstrument(CurrencyEnum.UAH);
    const account = seed.account({ instrumentId: hryvnia.id, type: AccountTypeEnum.CASH });

    await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
    insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: balance });

    return euro;
};

const seedBitcoinCryptoWithLiveRate = async (balance: number) => {
    const result = await seedBitcoinCryptoAccount(balance);

    insertOne(ExchangeRateEntityTable, {
        source: 'test',
        baseInstrumentId: result.bitcoin.id,
        quoteInstrumentId: result.euro.id,
        rate: BITCOIN_EURO_RATE
    });

    return result;
};

const expectCryptoTotals = (defaultInstrumentId: number, expectedTotal: number) => {
    const cryptoTotal = accountBalanceRepository.getTotalByAccountType(defaultInstrumentId, AccountTypeEnum.CRYPTO).get();
    const assetClassTotals = accountBalanceRepository.getAssetClassTotals(defaultInstrumentId).get();

    expect(cryptoTotal?.total).toBe(expectedTotal);
    expect(assetClassTotals?.cryptoTotal).toBe(expectedTotal);
};

describe('net worth currency conversion', () => {
    it('converts a foreign balance using the live rate when present', async () => {
        const euro = await seedHryvniaCashWithBalance(1000 * PRECISION);
        const hryvnia = await requireInstrument(CurrencyEnum.UAH);

        insertOne(ExchangeRateEntityTable, { source: 'test', baseInstrumentId: hryvnia.id, quoteInstrumentId: euro.id, rate: 0.02 });

        const netWorth = accountBalanceRepository.getNetWorth(euro.id).get();

        expect(netWorth?.netWorth).toBe(20 * PRECISION);
    });

    it('falls back to the historical rate instead of 1:1 when no live rate exists', async () => {
        const euro = await seedHryvniaCashWithBalance(1000 * PRECISION);

        const netWorth = accountBalanceRepository.getNetWorth(euro.id).get();
        const cashTotal = accountBalanceRepository.getTotalByAccountType(euro.id, AccountTypeEnum.CASH).get();

        expect(netWorth?.netWorth).toBeLessThan(50 * PRECISION);
        expect(netWorth?.netWorth).toBeGreaterThan(5 * PRECISION);
        expect(cashTotal?.total).toBe(netWorth?.netWorth);
    });

    it('does not value crypto totals or display amounts with fiat fallback when the live rate is missing', async () => {
        const { bitcoin, euro } = await seedBitcoinCryptoAccount(100 * PRECISION);

        const conversion = await exchangeRatesService.convertStrict(bitcoin.id, euro.id, 100 * PRECISION);

        expectCryptoTotals(euro.id, 0);
        expect(conversion).toBeNull();
    });

    it('converts crypto display amounts with the live rate when present', async () => {
        const { bitcoin, euro } = await seedBitcoinCryptoWithLiveRate(100 * PRECISION);

        const conversion = await exchangeRatesService.convertStrict(bitcoin.id, euro.id, 100 * PRECISION);

        expectCryptoTotals(euro.id, LIVE_CRYPTO_TOTAL);
        expect(conversion?.amount).toBe(LIVE_CRYPTO_TOTAL);
        expect(conversion?.exchangeRate).toBe(BITCOIN_EURO_RATE);
    });
});
