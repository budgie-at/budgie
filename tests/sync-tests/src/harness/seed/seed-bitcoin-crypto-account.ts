import { AccountBalanceEntityTable, AccountTypeEnum, CurrencyEnum, InstrumentTypeEnum, SettingsEntityTable } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { insertOne } from '../db/insert-one';
import { requireInstrument } from '../db/require-instrument';
import { testDb } from '../scenario/setup';

import { seed } from './seed';

export const seedBitcoinCryptoAccount = async (balance: number | null = null) => {
    const euro = await requireInstrument(CurrencyEnum.EUR);
    const bitcoin = seed.instrument({
        code: 'BTC',
        name: 'Bitcoin',
        symbol: 'BTC',
        type: InstrumentTypeEnum.CRYPTO
    });
    const account = seed.account({ instrumentId: bitcoin.id, type: AccountTypeEnum.CRYPTO });

    await testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

    if (isDefined(balance)) {
        insertOne(AccountBalanceEntityTable, { accountId: account.id, amount: balance });
    }

    return { account, bitcoin, euro };
};
