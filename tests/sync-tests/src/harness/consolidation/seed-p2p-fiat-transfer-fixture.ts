import { AccountTypeEnum, CurrencyEnum, ExternalSourceEnum, InstrumentTypeEnum, SettingsEntityTable } from '@budgie/contracts';

import { requireInstrument } from '../db/require-instrument';
import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';

import { seedExchangeRate } from './seed-exchange-rate';

import type { AccountEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

const UAH_PER_USD_RATE = 40;
const USD_PER_UAH_RATE = 1 / UAH_PER_USD_RATE;
const USD_PER_USDT_RATE = 1;

interface P2pFiatTransferFixture {
    readonly uah: InstrumentEntityInterface;
    readonly usdt: InstrumentEntityInterface;
    readonly bankAccount: AccountEntityInterface;
    readonly binanceAccount: AccountEntityInterface;
}

export const seedP2pFiatTransferFixture = async (): Promise<P2pFiatTransferFixture> => {
    const uah = await requireInstrument(CurrencyEnum.UAH);
    const usdt = seed.instrument({ code: 'USDT', name: 'Tether', symbol: 'USDT', type: InstrumentTypeEnum.CRYPTO });
    const bankAccount = seed.account({
        title: 'Monobank UAH',
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.MONOBANK,
        instrumentId: uah.id
    });
    const binanceAccount = seed.account({
        title: 'Binance SPOT · USDT',
        type: AccountTypeEnum.CRYPTO_SYNC,
        externalSource: ExternalSourceEnum.BINANCE,
        instrumentId: usdt.id
    });

    const usd = await requireInstrument(CurrencyEnum.USD);

    testDb.update(SettingsEntityTable).set({ defaultInstrumentId: usd.id }).run();
    seedExchangeRate(uah.id, usd.id, USD_PER_UAH_RATE);
    seedExchangeRate(usd.id, usdt.id, USD_PER_USDT_RATE);

    return { uah, usdt, bankAccount, binanceAccount };
};
