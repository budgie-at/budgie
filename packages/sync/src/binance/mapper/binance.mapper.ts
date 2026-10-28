import { PRECISION, convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { getUnixTime } from 'date-fns/getUnixTime';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { BinanceCapitalOutcomeEnum } from '../enum/binance-capital-outcome.enum';
import { BinanceTransferSourceEnum } from '../enum/binance-transfer-source.enum';
import { BinanceWalletEnum } from '../enum/binance-wallet.enum';
import { encodeBinanceAccountId } from '../utils/binance-account-id.util';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceC2cOrderApiInterface } from '../interface/binance-c2c-order-api.schema';
import type { BinanceConvertFlowApiInterface } from '../interface/binance-convert-api.schema';
import type { BinanceDepositApiInterface } from '../interface/binance-deposit-api.schema';
import type { BinanceEarnDailyTotalInterface } from '../interface/binance-earn-daily-total.interface';
import type { BinanceEarnRewardApiInterface } from '../interface/binance-earn-reward-api.schema';
import type { BinanceFiatOrderApiInterface } from '../interface/binance-fiat-order-api.schema';
import type { BinanceTradeApiInterface } from '../interface/binance-trade-api.schema';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { BinanceUniversalTransferApiInterface } from '../interface/binance-universal-transfer-api.schema';
import type { BinanceWithdrawalApiInterface } from '../interface/binance-withdrawal-api.schema';

const NO_NUMERIC_CODE = 0;
const MICRO_UNITS_DECIMALS = 6;
const DECIMAL_DIGITS_PATTERN = /^\d+$/u;
const MILLISECONDS_PER_SECOND = 1000;
const C2C_BUY_TRADE_TYPE = 'BUY';
const EARN_DATE_PART_DIGITS = 2;
const FUNDING_WALLET_TYPE = 1;
const SPOT_TO_FUNDING_TRANSFER_TYPE = 'MAIN_FUNDING';

const DEPOSIT_OUTCOME_BY_STATUS = new Map<number | undefined, BinanceCapitalOutcomeEnum>([
    [0, BinanceCapitalOutcomeEnum.PENDING],
    [1, BinanceCapitalOutcomeEnum.COMPLETED],
    [2, BinanceCapitalOutcomeEnum.REJECTED],
    [6, BinanceCapitalOutcomeEnum.COMPLETED],
    [7, BinanceCapitalOutcomeEnum.REJECTED],
    [8, BinanceCapitalOutcomeEnum.PENDING]
]);
const WITHDRAWAL_OUTCOME_BY_STATUS = new Map<number | undefined, BinanceCapitalOutcomeEnum>([
    [0, BinanceCapitalOutcomeEnum.PENDING],
    [1, BinanceCapitalOutcomeEnum.REJECTED],
    [2, BinanceCapitalOutcomeEnum.PENDING],
    [3, BinanceCapitalOutcomeEnum.REJECTED],
    [4, BinanceCapitalOutcomeEnum.PENDING],
    [5, BinanceCapitalOutcomeEnum.REJECTED],
    [6, BinanceCapitalOutcomeEnum.COMPLETED]
]);

const toUnixSeconds = (timeMs: number): number => Math.floor(timeMs / MILLISECONDS_PER_SECOND);

const encodeSpotAccountId = (asset: string): string => encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset });

const toSyncTransaction = (
    transaction: Omit<
        SyncTransactionInterface,
        'provider' | 'mcc' | 'originalMcc' | 'currencyCode' | 'commissionRate' | 'cashbackAmount' | 'balance' | 'hold' | 'operationAmount'
    >
): SyncTransactionInterface => ({
    provider: SyncProviderEnum.BINANCE,
    mcc: 0,
    originalMcc: 0,
    currencyCode: NO_NUMERIC_CODE,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    operationAmount:
        transaction.type === SyncTransactionTypeEnum.INCOME
            ? transaction.amount + transaction.feeAmount
            : transaction.amount - transaction.feeAmount,
    ...transaction
});

export const getBinanceCapitalWallet = (record: { readonly walletType?: number }): BinanceWalletEnum =>
    record.walletType === FUNDING_WALLET_TYPE ? BinanceWalletEnum.FUNDING : BinanceWalletEnum.SPOT;

export const parseBinanceAmount = (value: string): number | null => {
    if (!isNotEmptyString(value)) {
        return null;
    }

    const [integerPart, fractionalPart = ''] = value.trim().split('.');
    const isFractionValid = !isNotEmptyString(fractionalPart) || DECIMAL_DIGITS_PATTERN.test(fractionalPart);
    if (!DECIMAL_DIGITS_PATTERN.test(integerPart) || !isFractionValid) {
        return null;
    }

    const truncatedFraction = fractionalPart.slice(0, MICRO_UNITS_DECIMALS).padEnd(MICRO_UNITS_DECIMALS, '0');
    const totalMicroUnits = BigInt(integerPart) * BigInt(PRECISION) + BigInt(truncatedFraction);

    return totalMicroUnits > BigInt(Number.MAX_SAFE_INTEGER) ? null : convertFromMicroUnits(Number(totalMicroUnits));
};

const parseAmountAndClampedFee = (amountValue: string, feeValue: string): [number, number] | null => {
    const amount = parseBinanceAmount(amountValue);
    const fee = parseBinanceAmount(feeValue);

    return isDefined(amount) && isDefined(fee) ? [amount, fee >= amount ? 0 : fee] : null;
};

export const mapBinanceBalanceToAccount = (asset: string, wallet: BinanceWalletEnum, balance: number): SyncAccountInterface => ({
    id: encodeBinanceAccountId({ wallet, asset }),
    provider: SyncProviderEnum.BINANCE,
    currencyCode: asset,
    currencyCodeNumeric: NO_NUMERIC_CODE,
    balance,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CRYPTO,
    title: `Binance ${wallet} · ${asset}`
});

export const mapBinanceUnrepresentableBalanceToAccount = (asset: string, wallet: BinanceWalletEnum): SyncAccountInterface => ({
    ...mapBinanceBalanceToAccount(asset, wallet, 0),
    balanceState: SyncAccountBalanceStateEnum.UNREPRESENTABLE
});

export const getBinanceDepositOutcome = (deposit: Pick<BinanceDepositApiInterface, 'status'>): BinanceCapitalOutcomeEnum =>
    DEPOSIT_OUTCOME_BY_STATUS.get(deposit.status) ?? BinanceCapitalOutcomeEnum.PENDING;

export const getBinanceWithdrawalOutcome = (withdrawal: Pick<BinanceWithdrawalApiInterface, 'status'>): BinanceCapitalOutcomeEnum =>
    WITHDRAWAL_OUTCOME_BY_STATUS.get(withdrawal.status) ?? BinanceCapitalOutcomeEnum.PENDING;

export const buildBinanceDepositExternalId = (deposit: BinanceDepositApiInterface): string =>
    [deposit.id, deposit.txId].find(isNotEmptyString) ?? `${deposit.coin}-${deposit.insertTime}-${deposit.amount}`;

export const mapBinanceDepositToTransaction = (deposit: BinanceDepositApiInterface, accountId: string): SyncTransactionInterface | null => {
    const amount = parseBinanceAmount(deposit.amount);

    return isDefined(amount)
        ? toSyncTransaction({
              id: buildBinanceDepositExternalId(deposit),
              accountId,
              category: deposit.coin,
              time: toUnixSeconds(deposit.insertTime),
              type: SyncTransactionTypeEnum.INCOME,
              description: `Binance ${deposit.coin} deposit`,
              amount,
              feeAmount: 0
          })
        : null;
};

export const mapBinanceWithdrawalToTransaction = (
    withdrawal: BinanceWithdrawalApiInterface,
    accountId: string
): SyncTransactionInterface | null => {
    const parsed = parseAmountAndClampedFee(withdrawal.amount, withdrawal.transactionFee);

    return isDefined(parsed)
        ? toSyncTransaction({
              id: withdrawal.id,
              accountId,
              category: withdrawal.coin,
              time: getUnixTime(new Date(withdrawal.applyTime)),
              type: SyncTransactionTypeEnum.EXPENSE,
              description: `Binance ${withdrawal.coin} withdrawal`,
              amount: parsed[0],
              feeAmount: parsed[1]
          })
        : null;
};

export const mapBinanceFiatOrderToTransaction = (
    order: BinanceFiatOrderApiInterface,
    accountId: string,
    isDeposit: boolean
): SyncTransactionInterface | null => {
    const amount = parseBinanceAmount(order.amount);
    const feeAmount = parseBinanceAmount(order.totalFee);

    return isDefined(amount) && isDefined(feeAmount)
        ? toSyncTransaction({
              id: order.orderNo,
              accountId,
              category: order.fiatCurrency,
              time: toUnixSeconds(order.createTime),
              type: isDeposit ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE,
              description: isDeposit ? `Binance ${order.fiatCurrency} deposit` : `Binance ${order.fiatCurrency} withdrawal`,
              amount: isDeposit ? amount : amount + feeAmount,
              feeAmount
          })
        : null;
};

export const mapBinanceC2cOrderToTransaction = (order: BinanceC2cOrderApiInterface, accountId: string): SyncTransactionInterface | null => {
    const amount = parseBinanceAmount(order.amount);
    const quotedAmount = parseBinanceAmount(order.totalPrice);
    const quotedUnitPrice = parseBinanceAmount(order.unitPrice);
    if (!isDefined(amount) || !isDefined(quotedAmount) || !isDefined(quotedUnitPrice)) {
        return null;
    }

    const isBuy = order.tradeType === C2C_BUY_TRADE_TYPE;

    return toSyncTransaction({
        id: `binance:c2c:${order.orderNumber}`,
        accountId,
        category: order.asset,
        time: toUnixSeconds(order.createTime),
        type: isBuy ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE,
        description: isBuy ? `Binance P2P buy ${order.asset}` : `Binance P2P sell ${order.asset}`,
        amount,
        feeAmount: 0,
        quotedCurrencyCode: order.fiat,
        quotedAmount,
        quotedUnitPrice
    });
};

export const mapBinanceTradeToTransfer = (
    trade: BinanceTradeApiInterface,
    baseAsset: string,
    quoteAsset: string
): BinanceTransferInterface | null => {
    const baseAmount = parseBinanceAmount(trade.qty);
    const quoteAmount = parseBinanceAmount(trade.quoteQty);
    const feeAmount = parseBinanceAmount(trade.commission);
    if (!isDefined(baseAmount) || !isDefined(quoteAmount) || !isDefined(feeAmount)) {
        return null;
    }

    const baseAccountId = encodeSpotAccountId(baseAsset);
    const quoteAccountId = encodeSpotAccountId(quoteAsset);

    return {
        externalId: `binance:trade:${trade.symbol}:${trade.id}`,
        fromAssetAccountId: trade.isBuyer ? quoteAccountId : baseAccountId,
        toAssetAccountId: trade.isBuyer ? baseAccountId : quoteAccountId,
        fromAmount: trade.isBuyer ? quoteAmount : baseAmount,
        toAmount: trade.isBuyer ? baseAmount : quoteAmount,
        feeAssetAccountId: feeAmount > 0 ? encodeSpotAccountId(trade.commissionAsset) : null,
        feeAmount,
        time: toUnixSeconds(trade.time),
        description: `Binance ${trade.symbol} ${trade.isBuyer ? 'buy' : 'sell'}`,
        source: BinanceTransferSourceEnum.SPOT_TRADE
    };
};

export const mapBinanceConvertToTransfer = (flow: BinanceConvertFlowApiInterface): BinanceTransferInterface | null => {
    const fromAmount = parseBinanceAmount(flow.fromAmount);
    const toAmount = parseBinanceAmount(flow.toAmount);

    return isDefined(fromAmount) && isDefined(toAmount)
        ? {
              externalId: `binance:convert:${flow.orderId}`,
              fromAssetAccountId: encodeSpotAccountId(flow.fromAsset),
              toAssetAccountId: encodeSpotAccountId(flow.toAsset),
              fromAmount,
              toAmount,
              feeAssetAccountId: null,
              feeAmount: 0,
              time: toUnixSeconds(flow.createTime),
              description: `Binance convert ${flow.fromAsset} to ${flow.toAsset}`,
              source: BinanceTransferSourceEnum.CONVERT
          }
        : null;
};

export const mapBinanceUniversalTransferToTransfer = (transfer: BinanceUniversalTransferApiInterface): BinanceTransferInterface | null => {
    const amount = parseBinanceAmount(transfer.amount);
    if (!isDefined(amount)) {
        return null;
    }

    const spotAccountId = encodeSpotAccountId(transfer.asset);
    const fundingAccountId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: transfer.asset });
    const isSpotToFunding = transfer.type === SPOT_TO_FUNDING_TRANSFER_TYPE;

    return {
        externalId: `binance:universal-transfer:${transfer.tranId}`,
        fromAssetAccountId: isSpotToFunding ? spotAccountId : fundingAccountId,
        toAssetAccountId: isSpotToFunding ? fundingAccountId : spotAccountId,
        fromAmount: amount,
        toAmount: amount,
        feeAssetAccountId: null,
        feeAmount: 0,
        time: toUnixSeconds(transfer.timestamp),
        description: isSpotToFunding ? `Binance ${transfer.asset} Spot to Funding` : `Binance ${transfer.asset} Funding to Spot`,
        source: BinanceTransferSourceEnum.UNIVERSAL_TRANSFER
    };
};

const buildEarnDayKey = (timeMs: number): string => {
    const date = new Date(timeMs);
    const month = `${date.getUTCMonth() + 1}`.padStart(EARN_DATE_PART_DIGITS, '0');
    const day = `${date.getUTCDate()}`.padStart(EARN_DATE_PART_DIGITS, '0');

    return `${date.getUTCFullYear()}-${month}-${day}`;
};

export const mapBinanceEarnRewardsToTransactions = (
    asset: string,
    accountId: string,
    rewards: readonly BinanceEarnRewardApiInterface[]
): SyncTransactionInterface[] => {
    const dailyTotals = new Map<string, BinanceEarnDailyTotalInterface>();
    for (const reward of rewards) {
        const dayKey = buildEarnDayKey(reward.time);
        const amount = parseBinanceAmount(reward.rewards);
        const rewardMicroUnits = isDefined(amount) && amount > 0 ? convertToMicroUnits(amount) : 0;
        const dailyTotal = dailyTotals.get(dayKey) ?? { totalMicroUnits: 0, lastRewardTime: 0 };
        dailyTotals.set(dayKey, {
            totalMicroUnits: dailyTotal.totalMicroUnits + rewardMicroUnits,
            lastRewardTime: Math.max(dailyTotal.lastRewardTime, reward.time)
        });
    }

    return [...dailyTotals.entries()]
        .filter(([, dailyTotal]) => dailyTotal.totalMicroUnits > 0)
        .map(([dayKey, dailyTotal]) =>
            toSyncTransaction({
                id: `binance:earn:${asset}:${dayKey}`,
                accountId,
                category: asset,
                time: toUnixSeconds(dailyTotal.lastRewardTime),
                type: SyncTransactionTypeEnum.INCOME,
                description: `Binance Earn reward ${asset}`,
                amount: convertFromMicroUnits(dailyTotal.totalMicroUnits),
                feeAmount: 0
            })
        );
};
