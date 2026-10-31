import type {
    BinanceAssetBalanceApiInterface,
    BinanceC2cOrderApiInterface,
    BinanceConvertFlowApiInterface,
    BinanceDepositApiInterface,
    BinanceDividendApiInterface,
    BinanceDustLogApiInterface,
    BinanceEarnPositionApiInterface,
    BinanceEarnRewardApiInterface,
    BinanceFiatOrderApiInterface,
    BinanceFiatPaymentApiInterface,
    BinanceLockedEarnPositionApiInterface,
    BinanceLockedEarnRewardApiInterface,
    BinanceStakingRewardApiInterface,
    BinanceTradeApiInterface,
    BinanceUniversalTransferApiInterface,
    BinanceWithdrawalApiInterface
} from '@budgie/sync';

type BalanceOverrides = Partial<BinanceAssetBalanceApiInterface> & Pick<BinanceAssetBalanceApiInterface, 'asset'>;

type DepositOverrides = Partial<BinanceDepositApiInterface> & Pick<BinanceDepositApiInterface, 'coin' | 'amount'>;

type WithdrawalOverrides = Partial<BinanceWithdrawalApiInterface> & Pick<BinanceWithdrawalApiInterface, 'id' | 'coin' | 'amount'>;

type FiatOrderOverrides = Partial<BinanceFiatOrderApiInterface> & Pick<BinanceFiatOrderApiInterface, 'orderNo' | 'fiatCurrency' | 'amount'>;

type FiatPaymentOverrides = Partial<BinanceFiatPaymentApiInterface> &
    Pick<BinanceFiatPaymentApiInterface, 'orderNo' | 'fiatCurrency' | 'cryptoCurrency' | 'sourceAmount' | 'obtainAmount'>;

type C2cOrderOverrides = Partial<BinanceC2cOrderApiInterface> &
    Pick<BinanceC2cOrderApiInterface, 'orderNumber' | 'tradeType' | 'asset' | 'amount'>;

type TradeOverrides = Partial<BinanceTradeApiInterface> & Pick<BinanceTradeApiInterface, 'symbol' | 'id' | 'qty' | 'quoteQty' | 'isBuyer'>;

type ConvertFlowOverrides = Partial<BinanceConvertFlowApiInterface> &
    Pick<BinanceConvertFlowApiInterface, 'orderId' | 'fromAsset' | 'fromAmount' | 'toAsset' | 'toAmount'>;

type EarnPositionOverrides = Partial<BinanceEarnPositionApiInterface> & Pick<BinanceEarnPositionApiInterface, 'asset' | 'totalAmount'>;

type LockedEarnPositionOverrides = Partial<BinanceLockedEarnPositionApiInterface> &
    Pick<BinanceLockedEarnPositionApiInterface, 'asset' | 'amount'>;

type UniversalTransferOverrides = Partial<BinanceUniversalTransferApiInterface> &
    Pick<BinanceUniversalTransferApiInterface, 'asset' | 'amount' | 'type' | 'tranId'>;

type EarnRewardOverrides = Partial<BinanceEarnRewardApiInterface> & Pick<BinanceEarnRewardApiInterface, 'asset' | 'rewards' | 'time'>;

type DividendOverrides = Partial<BinanceDividendApiInterface> &
    Pick<BinanceDividendApiInterface, 'tranId' | 'asset' | 'amount' | 'divTime'>;

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
        status: 1,
        walletType: 0,
        ...overrides
    }),
    withdrawal: (overrides: WithdrawalOverrides): BinanceWithdrawalApiInterface => ({
        txId: `txid-${overrides.id}`,
        transactionFee: '0',
        applyTime: new Date().toISOString(),
        status: 6,
        walletType: 0,
        ...overrides
    }),
    fiatOrder: (overrides: FiatOrderOverrides): BinanceFiatOrderApiInterface => ({
        totalFee: '0',
        status: 'Successful',
        createTime: Date.now(),
        ...overrides
    }),
    fiatPayment: (overrides: FiatPaymentOverrides): BinanceFiatPaymentApiInterface => ({
        price: '1',
        status: 'Completed',
        createTime: Date.now(),
        ...overrides
    }),
    c2cOrder: (overrides: C2cOrderOverrides): BinanceC2cOrderApiInterface => ({
        fiat: 'UAH',
        totalPrice: overrides.amount,
        unitPrice: '1',
        orderStatus: 'COMPLETED',
        createTime: Date.now(),
        takerCommission: '0',
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
    fill: (symbol: string, id: number, overrides: Partial<BinanceTradeApiInterface> = {}): BinanceTradeApiInterface =>
        buildBinance.trade({ symbol, id, qty: '1', quoteQty: '1', isBuyer: true, ...overrides }),
    convertFlow: (overrides: ConvertFlowOverrides): BinanceConvertFlowApiInterface => ({
        quoteId: `quote-${overrides.orderId}`,
        orderStatus: 'SUCCESS',
        createTime: Date.now(),
        ...overrides
    }),
    universalTransfer: (overrides: UniversalTransferOverrides): BinanceUniversalTransferApiInterface => ({
        status: 'CONFIRMED',
        timestamp: Date.now(),
        ...overrides
    }),
    earnPosition: (overrides: EarnPositionOverrides): BinanceEarnPositionApiInterface => ({ ...overrides }),
    lockedEarnPosition: (overrides: LockedEarnPositionOverrides): BinanceLockedEarnPositionApiInterface => ({ ...overrides }),
    earnReward: (overrides: EarnRewardOverrides): BinanceEarnRewardApiInterface => ({ ...overrides }),
    lockedEarnReward: (overrides: BinanceLockedEarnRewardApiInterface): BinanceLockedEarnRewardApiInterface => ({ ...overrides }),
    stakingReward: (overrides: BinanceStakingRewardApiInterface): BinanceStakingRewardApiInterface => ({ ...overrides }),
    dividend: (overrides: DividendOverrides): BinanceDividendApiInterface => ({ id: overrides.tranId, direction: 1, ...overrides }),
    dustLog: (overrides: BinanceDustLogApiInterface): BinanceDustLogApiInterface => ({ ...overrides })
};
