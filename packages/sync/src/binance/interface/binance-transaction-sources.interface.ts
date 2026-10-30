import type { BinanceEarnRewardKindEnum } from '../enum/binance-earn-reward-kind.enum';
import type { BinanceC2cOrderApiInterface } from './binance-c2c-order-api.schema';
import type { BinanceDepositApiInterface } from './binance-deposit-api.schema';
import type { BinanceDividendApiInterface } from './binance-dividend-api.schema';
import type { BinanceEarnRewardApiInterface } from './binance-earn-reward-api.schema';
import type { BinanceFiatOrderApiInterface } from './binance-fiat-order-api.schema';
import type { BinanceFiatPaymentApiInterface } from './binance-fiat-payment-api.schema';
import type { BinanceWithdrawalApiInterface } from './binance-withdrawal-api.schema';

export interface BinanceTransactionSourcesInterface {
    readonly deposits: readonly BinanceDepositApiInterface[];
    readonly withdrawals: readonly BinanceWithdrawalApiInterface[];
    readonly fiatDeposits: readonly BinanceFiatOrderApiInterface[];
    readonly fiatWithdrawals: readonly BinanceFiatOrderApiInterface[];
    readonly fiatPayments: readonly BinanceFiatPaymentApiInterface[];
    readonly c2cOrders: readonly BinanceC2cOrderApiInterface[];
    readonly rewards: readonly { readonly kind: BinanceEarnRewardKindEnum; readonly rewards: readonly BinanceEarnRewardApiInterface[] }[];
    readonly dividends: readonly BinanceDividendApiInterface[];
}
