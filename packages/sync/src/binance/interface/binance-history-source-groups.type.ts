import type { BinanceHistorySourceEnum } from '../enum/binance-history-source.enum';

export type BinanceRewardHistorySourceType =
    | BinanceHistorySourceEnum.EARN
    | BinanceHistorySourceEnum.ETH_STAKING
    | BinanceHistorySourceEnum.LOCKED_EARN
    | BinanceHistorySourceEnum.SOL_STAKING;

export type BinanceTransactionHistorySourceType = Exclude<
    BinanceHistorySourceEnum,
    BinanceHistorySourceEnum.CONVERT | BinanceHistorySourceEnum.DUST
>;
