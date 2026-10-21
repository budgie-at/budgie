import { AccountTypeEnum, CurrencyEnum, SyncModeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { requireInstrument } from '../db/require-instrument';
import { buildMonobank } from '../monobank/build-monobank';
import { monobankStub } from '../monobank/monobank-stub';
import { seed } from '../seed/seed';

const WALLET_CAPTURE_MONOBANK_ACCOUNT_ID = 'mono-wallet-card';

export const walletCaptureSeedMonobankAccount = Effect.fnUntraced(function* (forwardSyncFromAt: Date) {
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
    const account = yield* seed.account({
        title: 'Wallet card',
        externalId: WALLET_CAPTURE_MONOBANK_ACCOUNT_ID,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: hryvnia.id
    });

    yield* seed.sync({ accountId: account.id, mode: SyncModeEnum.FORWARD, forwardSyncFromAt });
    monobankStub.clientInfo(buildMonobank.clientInfoWith([WALLET_CAPTURE_MONOBANK_ACCOUNT_ID]));

    return account;
});
