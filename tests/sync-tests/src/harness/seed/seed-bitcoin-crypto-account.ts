import { AccountTypeEnum, CurrencyEnum, InstrumentTypeEnum, SettingsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { requireInstrument } from '../db/require-instrument';
import { testDb } from '../scenario/setup';

import { seed } from './seed';
import { seedLedgerBalance } from './seed-ledger-balance';

export const seedBitcoinCryptoAccount = Effect.fnUntraced(function* (balance: number | null = null) {
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const bitcoin = yield* seed.instrument({
        code: 'BTC',
        name: 'Bitcoin',
        symbol: 'BTC',
        type: InstrumentTypeEnum.CRYPTO
    });
    const account = yield* seed.account({ instrumentId: bitcoin.id, type: AccountTypeEnum.CRYPTO });

    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

    if (isDefined(balance)) {
        yield* seedLedgerBalance(account.id, balance);
    }

    return { account, bitcoin, euro };
});
