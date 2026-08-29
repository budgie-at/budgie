import type { BinanceC2cOrderApiInterface } from './binance-c2c-order-api.schema';
import type { BinanceDepositApiInterface } from './binance-deposit-api.schema';
import type { BinanceEarnRewardApiInterface } from './binance-earn-reward-api.schema';
import type { BinanceFiatOrderApiInterface } from './binance-fiat-order-api.schema';
import type { BinanceWithdrawalApiInterface } from './binance-withdrawal-api.schema';

export interface BinanceTransactionSourcesInterface {
    readonly deposits: BinanceDepositApiInterface[];
    readonly withdrawals: BinanceWithdrawalApiInterface[];
    readonly fiatDeposits: BinanceFiatOrderApiInterface[];
    readonly fiatWithdrawals: BinanceFiatOrderApiInterface[];
    readonly c2cOrders: BinanceC2cOrderApiInterface[];
    readonly earnRewards: BinanceEarnRewardApiInterface[];
}
