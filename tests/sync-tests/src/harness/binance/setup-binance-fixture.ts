import { encodeBinanceAccountId, BinanceWalletEnum } from '@budgie/sync';
import { AccountTypeEnum, SyncModeEnum, SyncStatusEnum, ExternalSourceEnum, InstrumentTypeEnum } from '@budgie/contracts';

import { seed } from '../seed/seed';
import { binanceStub } from './binance-stub';

const BINANCE_TOKEN = JSON.stringify({ apiKey: 'test-api-key', apiSecret: 'test-api-secret' });

interface SetupBinanceFixtureOptions {
    readonly asset?: string;
    readonly wallet?: BinanceWalletEnum;
    readonly mode?: SyncModeEnum;
    readonly backwardSyncFromAt?: Date;
    readonly forwardSyncFromAt?: Date;
    readonly instrumentType?: InstrumentTypeEnum;
}

export const setupBinanceFixture = (options: SetupBinanceFixtureOptions = {}) => {
    const asset = options.asset ?? 'BTC';
    const wallet = options.wallet ?? BinanceWalletEnum.SPOT;
    const mode = options.mode ?? SyncModeEnum.BACKWARD;
    const instrumentType = options.instrumentType ?? InstrumentTypeEnum.CRYPTO;
    const externalId = encodeBinanceAccountId({ wallet, asset });

    const instrument = seed.instrument({ code: asset, name: asset, symbol: asset, type: instrumentType });
    const account = seed.account({
        externalId,
        externalSource: ExternalSourceEnum.BINANCE,
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId: instrument.id
    });
    const sync = seed.sync({
        accountId: account.id,
        token: BINANCE_TOKEN,
        provider: ExternalSourceEnum.BINANCE,
        mode,
        status: SyncStatusEnum.SYNCING,
        backwardSyncFromAt: options.backwardSyncFromAt ?? new Date(),
        backwardSyncedAt: null,
        forwardSyncFromAt: options.forwardSyncFromAt ?? new Date()
    });

    binanceStub.serverTime();
    binanceStub.exchangeInfoAllValid();
    binanceStub.spotBalances([]);
    binanceStub.fundingBalances([]);
    binanceStub.deposits([]);
    binanceStub.withdrawals([]);
    binanceStub.fiatOrders([], []);
    binanceStub.c2cOrders([], []);
    binanceStub.myTrades({});
    binanceStub.convertTradeFlow([]);
    binanceStub.earnPositions([]);
    binanceStub.lockedEarnPositions([]);
    binanceStub.earnRewards([]);

    return { account, sync, instrument, externalId, token: BINANCE_TOKEN, asset, wallet };
};
