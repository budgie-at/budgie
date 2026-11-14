import { AccountTypeEnum, CurrencyEnum, SettingsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { requireInstrument } from '../db/require-instrument';
import { testDb } from '../scenario/test-db';

import { seed } from './seed';

export const seedCryptoSyncAccount = Effect.fnUntraced(function* (coinCode: string) {
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const coin = yield* requireInstrument(coinCode);
    const account = yield* seed.account({ title: coinCode, instrumentId: coin.id, type: AccountTypeEnum.CRYPTO_SYNC });

    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

    return { euro, coin, account };
});
