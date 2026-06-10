import type {
    BinanceAssetBalanceApiInterface,
    BinanceC2cOrderApiInterface,
    BinanceConvertFlowApiInterface,
    BinanceDepositApiInterface,
    BinanceEarnPositionApiInterface,
    BinanceEarnRewardApiInterface,
    BinanceFiatOrderApiInterface,
    BinanceLockedEarnPositionApiInterface,
    BinanceTradeApiInterface,
    BinanceWithdrawalApiInterface
} from '@budgie/sync';

type BalanceOverrides = Partial<BinanceAssetBalanceApiInterface> & Pick<BinanceAssetBalanceApiInterface, 'asset'>;

type DepositOverrides = Partial<BinanceDepositApiInterface> & Pick<BinanceDepositApiInterface, 'coin' | 'amount'>;

type WithdrawalOverrides = Partial<BinanceWithdrawalApiInterface> & Pick<BinanceWithdrawalApiInterface, 'id' | 'coin' | 'amount'>;

type FiatOrderOverrides = Partial<BinanceFiatOrderApiInterface> & Pick<BinanceFiatOrderApiInterface, 'orderNo' | 'fiatCurrency' | 'amount'>;

type C2cOrderOverrides = Partial<BinanceC2cOrderApiInterface> &
    Pick<BinanceC2cOrderApiInterface, 'orderNumber' | 'tradeType' | 'asset' | 'amount'>;

type TradeOverrides = Partial<BinanceTradeApiInterface> & Pick<BinanceTradeApiInterface, 'symbol' | 'id' | 'qty' | 'quoteQty' | 'isBuyer'>;

type ConvertFlowOverrides = Partial<BinanceConvertFlowApiInterface> &
    Pick<BinanceConvertFlowApiInterface, 'orderId' | 'fromAsset' | 'fromAmount' | 'toAsset' | 'toAmount'>;

type EarnPositionOverrides = Partial<BinanceEarnPositionApiInterface> & Pick<BinanceEarnPositionApiInterface, 'asset' | 'totalAmount'>;

type LockedEarnPositionOverrides = Partial<BinanceLockedEarnPositionApiInterface> &
    Pick<BinanceLockedEarnPositionApiInterface, 'asset' | 'amount'>;

type EarnRewardOverrides = Partial<BinanceEarnRewardApiInterface> & Pick<BinanceEarnRewardApiInterface, 'asset' | 'rewards' | 'time'>;

export const buildBinance = {
    balance: (overrides: BalanceOverrides): BinanceAssetBalanceApiInterface => ({
        free: '0',
        locked: '0',
        ...overrides
    }),
    deposit: (overrides: DepositOverrides): BinanceDepositApiInterface => ({
        id: `dep-${overrides.coin}-${overrides.amount}`,
        txId: `txid-${overrides.coin}-${overrides.amount}`,
        insertTime: Date.now(),
        ...overrides
    }),
    withdrawal: (overrides: WithdrawalOverrides): BinanceWithdrawalApiInterface => ({
        txId: `txid-${overrides.id}`,
        transactionFee: '0',
        applyTime: new Date().toISOString(),
        ...overrides
    }),
    fiatOrder: (overrides: FiatOrderOverrides): BinanceFiatOrderApiInterface => ({
        totalFee: '0',
        status: 'Successful',
        createTime: Date.now(),
        ...overrides
    }),
    c2cOrder: (overrides: C2cOrderOverrides): BinanceC2cOrderApiInterface => ({
        fiat: 'UAH',
        totalPrice: overrides.amount,
        unitPrice: '1',
        orderStatus: 'COMPLETED',
        createTime: Date.now(),
        commission: '0',
        ...overrides
    }),
    trade: (overrides: TradeOverrides): BinanceTradeApiInterface => ({
        orderId: overrides.id,
        price: '1',
        commission: '0',
        commissionAsset: 'BNB',
        time: Date.now(),
        isMaker: false,
        ...overrides
    }),
    convertFlow: (overrides: ConvertFlowOverrides): BinanceConvertFlowApiInterface => ({
        quoteId: `quote-${overrides.orderId}`,
        orderStatus: 'SUCCESS',
        createTime: Date.now(),
        ...overrides
    }),
    earnPosition: (overrides: EarnPositionOverrides): BinanceEarnPositionApiInterface => ({ ...overrides }),
    lockedEarnPosition: (overrides: LockedEarnPositionOverrides): BinanceLockedEarnPositionApiInterface => ({ ...overrides }),
    earnReward: (overrides: EarnRewardOverrides): BinanceEarnRewardApiInterface => ({ ...overrides })
};
