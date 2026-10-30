import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

export const buildBinanceToken = (apiKey: string): string => JSON.stringify({ apiKey, apiSecret: `${apiKey}-secret` });

export const seedSecondKeyAccount = (asset: string, instrumentId: number, token: string) =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset }),
            externalSource: ExternalSourceEnum.BINANCE,
            type: AccountTypeEnum.CRYPTO_SYNC,
            instrumentId
        });
        yield* seed.sync({
            accountId: account.id,
            token,
            provider: ExternalSourceEnum.BINANCE,
            mode: SyncModeEnum.BACKWARD,
            status: SyncStatusEnum.SYNCING,
            backwardSyncFromAt: new Date()
        });

        return account;
    });
