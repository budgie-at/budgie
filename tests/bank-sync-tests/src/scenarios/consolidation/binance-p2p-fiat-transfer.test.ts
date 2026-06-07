import { describe, expect, it } from 'vitest';

import {
    AccountTypeEnum,
    CurrencyEnum,
    ExchangeRateCreateEntityInterface,
    ExchangeRateEntityTable,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    PRECISION,
    SettingsEntityTable,
    TransactionConsolidationTypeEnum
} from '@budgie/contracts';

import { fetchCanonicalsOfType, fetchTransactionById, requireInstrument, seed, seedBankPair, testDb } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

import type { AccountEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

const UAH_TOTAL = 4_000 * PRECISION;
const USDT_AMOUNT = 100 * PRECISION;
const UAH_PER_USD_RATE = 40;
const USD_PER_UAH_RATE = 1 / UAH_PER_USD_RATE;
const USD_PER_USDT_RATE = 1;
const P2P_OPERATED_AT = new Date(2026, 0, 15, 12, 0, 0);
const BANK_LEG_OFFSET_MS = 2 * 60 * 1000;
const OUT_OF_WINDOW_OFFSET_MS = 3 * 60 * 60 * 1000;

const seedExchangeRate = (baseInstrumentId: number, quoteInstrumentId: number, rate: number): void => {
    testDb
        .insert(ExchangeRateEntityTable)
        .values({ source: 'test', baseInstrumentId, quoteInstrumentId, rate } satisfies ExchangeRateCreateEntityInterface)
        .run();
};

const seedUsdtInstrument = (): InstrumentEntityInterface =>
    seed.instrument({ code: 'USDT', name: 'Tether', symbol: 'USDT', type: InstrumentTypeEnum.CRYPTO });

const seedMonobankAccount = (instrumentId: number, title = 'Monobank UAH'): AccountEntityInterface =>
    seed.account({ title, type: AccountTypeEnum.BANK_SYNC, externalSource: ExternalSourceEnum.MONOBANK, instrumentId });

const seedBinanceUsdtAccount = (usdtInstrumentId: number): AccountEntityInterface =>
    seed.account({
        title: 'Binance SPOT · USDT',
        type: AccountTypeEnum.CRYPTO_SYNC,
        externalSource: ExternalSourceEnum.BINANCE,
        instrumentId: usdtInstrumentId
    });

const seedBaseTriangulationRates = async (uahInstrumentId: number, usdtInstrumentId: number): Promise<void> => {
    const usd = await requireInstrument(CurrencyEnum.USD);

    testDb.update(SettingsEntityTable).set({ defaultInstrumentId: usd.id }).run();
    seedExchangeRate(uahInstrumentId, usd.id, USD_PER_UAH_RATE);
    seedExchangeRate(usd.id, usdtInstrumentId, USD_PER_USDT_RATE);
};

describe('consolidation/binance-p2p-fiat-transfer', () => {
    it('auto-consolidates a bank UAH expense with a Binance USDT P2P top-up income via a triangulated rate', async () => {
        const uah = await requireInstrument(CurrencyEnum.UAH);
        const usdt = seedUsdtInstrument();
        const bankAccount = seedMonobankAccount(uah.id);
        const binanceAccount = seedBinanceUsdtAccount(usdt.id);

        await seedBaseTriangulationRates(uah.id, usdt.id);

        const expense = seedBankPair.expense(
            { externalId: 'mono-uah-p2p-out', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: UAH_TOTAL }
        );
        const income = seedBankPair.income(
            { externalId: 'binance:c2c:buy-1', operatedAt: new Date(P2P_OPERATED_AT.getTime() + BANK_LEG_OFFSET_MS) },
            { accountId: binanceAccount.id, amount: USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });

        const [canonical] = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);
        expect(canonical?.fromAccountId).toBe(bankAccount.id);
        expect(canonical?.toAccountId).toBe(binanceAccount.id);
        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonical?.id);
        expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonical?.id);
    });

    it('auto-consolidates a Binance USDT P2P sell expense with a bank UAH cash-out income', async () => {
        const uah = await requireInstrument(CurrencyEnum.UAH);
        const usdt = seedUsdtInstrument();
        const bankAccount = seedMonobankAccount(uah.id);
        const binanceAccount = seedBinanceUsdtAccount(usdt.id);

        await seedBaseTriangulationRates(uah.id, usdt.id);

        const expense = seedBankPair.expense(
            { externalId: 'binance:c2c:sell-1', operatedAt: P2P_OPERATED_AT },
            { accountId: binanceAccount.id, amount: USDT_AMOUNT }
        );
        const income = seedBankPair.income(
            { externalId: 'mono-uah-p2p-in', operatedAt: new Date(P2P_OPERATED_AT.getTime() + BANK_LEG_OFFSET_MS) },
            { accountId: bankAccount.id, amount: UAH_TOTAL }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result).toEqual({ found: 1, consolidated: 1 });

        const [canonical] = fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER);
        expect(canonical?.fromAccountId).toBe(binanceAccount.id);
        expect(canonical?.toAccountId).toBe(bankAccount.id);
        expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonical?.id);
        expect(fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonical?.id);
    });

    it('does not consolidate a pair whose implied rate is far from the market rate', async () => {
        const uah = await requireInstrument(CurrencyEnum.UAH);
        const usdt = seedUsdtInstrument();
        const bankAccount = seedMonobankAccount(uah.id);
        const binanceAccount = seedBinanceUsdtAccount(usdt.id);

        await seedBaseTriangulationRates(uah.id, usdt.id);

        seedBankPair.expense(
            { externalId: 'mono-uah-off-rate', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: 8_000 * PRECISION }
        );
        seedBankPair.income(
            { externalId: 'binance:c2c:buy-off-rate', operatedAt: new Date(P2P_OPERATED_AT.getTime() + BANK_LEG_OFFSET_MS) },
            { accountId: binanceAccount.id, amount: USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(0);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });

    it('does not consolidate a correctly-priced pair that falls outside the time window', async () => {
        const uah = await requireInstrument(CurrencyEnum.UAH);
        const usdt = seedUsdtInstrument();
        const bankAccount = seedMonobankAccount(uah.id);
        const binanceAccount = seedBinanceUsdtAccount(usdt.id);

        await seedBaseTriangulationRates(uah.id, usdt.id);

        seedBankPair.expense(
            { externalId: 'mono-uah-late', operatedAt: P2P_OPERATED_AT },
            { accountId: bankAccount.id, amount: UAH_TOTAL }
        );
        seedBankPair.income(
            { externalId: 'binance:c2c:buy-late', operatedAt: new Date(P2P_OPERATED_AT.getTime() + OUT_OF_WINDOW_OFFSET_MS) },
            { accountId: binanceAccount.id, amount: USDT_AMOUNT }
        );

        const result = await transferConsolidationService.consolidate();

        expect(result.consolidated).toBe(0);
        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
    });
});
