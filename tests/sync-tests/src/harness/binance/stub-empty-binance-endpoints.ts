import { binanceStub } from './binance-stub';

export const stubEmptyBinanceEndpoints = (serverTimeOffsetMs?: number): void => {
    binanceStub.serverTime(serverTimeOffsetMs);
    binanceStub.exchangeInfoAllValid();
    binanceStub.spotBalances([]);
    binanceStub.fundingBalances([]);
    binanceStub.deposits([]);
    binanceStub.withdrawals([]);
    binanceStub.fiatOrders([], []);
    binanceStub.fiatPayments([]);
    binanceStub.c2cOrders([], []);
    binanceStub.myTrades({});
    binanceStub.convertTradeFlow([]);
    binanceStub.universalTransfers([]);
    binanceStub.earnPositions([]);
    binanceStub.lockedEarnPositions([]);
    binanceStub.earnRewards([]);
    binanceStub.lockedEarnRewards([]);
    binanceStub.ethStakingRewards([]);
    binanceStub.dividends([]);
    binanceStub.dustLogs([]);
};
