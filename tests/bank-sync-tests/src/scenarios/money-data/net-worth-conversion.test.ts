import { describe, expect, it } from 'vitest';

import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    CurrencyEnum,
    ExchangeRateEntityTable,
    InstrumentTypeEnum,
    PRECISION,
    SettingsEntityTable
} from '@budgie/contracts';
import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { exchangeRatesService } from '@app/exchange-rate/service/exchange-rates.service';

import { requireInstrument } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/setup';
import { seed } from '../../harness/seed/seed';

const BITCOIN_EURO_RATE = 50_000;

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
        const { bitcoin, euro } = await seedBitcoinCryptoWithBalance(100 * PRECISION);

        const conversion = await exchangeRatesService.convertStrict(bitcoin.id, euro.id, 100 * PRECISION);

        expectCryptoTotals(euro.id, 0);
        expect(conversion).toBeNull();
    });

    it('converts crypto display amounts with the live rate when present', async () => {
        const { bitcoin, euro } = await seedBitcoinCryptoWithLiveRate(100 * PRECISION);

        const conversion = await exchangeRatesService.convertStrict(bitcoin.id, euro.id, 100 * PRECISION);

        expectCryptoTotals(euro.id, 5_000_000 * PRECISION);
        expect(conversion?.amount).toBe(5_000_000 * PRECISION);
        expect(conversion?.exchangeRate).toBe(BITCOIN_EURO_RATE);
    });
});

const seedHryvniaCashWithBalance = async (balance: number) => {
    const euro = await requireInstrument(CurrencyEnum.EUR);
    const hryvnia = await requireInstrument(CurrencyEnum.UAH);
    const account = seed.account({ instrumentId: hryvnia.id, type: AccountTypeEnum.CASH });

    await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
    insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: balance });

    return euro;
};

const seedBitcoinCryptoWithBalance = async (balance: number) => {
    const euro = await requireInstrument(CurrencyEnum.EUR);
    const bitcoin = seed.instrument({
        code: 'BTC',
        name: 'Bitcoin',
        symbol: 'BTC',
        type: InstrumentTypeEnum.CRYPTO
    });
    const account = seed.account({ instrumentId: bitcoin.id, type: AccountTypeEnum.CRYPTO });

    await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
    insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: balance });

    return { bitcoin, euro };
};

const seedBitcoinCryptoWithLiveRate = async (balance: number) => {
    const result = await seedBitcoinCryptoWithBalance(balance);

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
