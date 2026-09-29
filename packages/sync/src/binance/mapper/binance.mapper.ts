/* eslint-disable max-lines -- File owns the single BinanceMapper class; package rule mandates one mapper class per provider, splitting would fragment it -- approved by human */
import { getUnixTime } from 'date-fns/getUnixTime';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { BINANCE_NO_NUMERIC_CODE } from '../constant/binance-no-numeric-code.constant';
import { BINANCE_MICRO_UNITS_PRECISION } from '../constant/binance-precision.constant';
import { BinanceTransferSourceEnum } from '../enum/binance-transfer-source.enum';
import { BinanceWalletEnum } from '../enum/binance-wallet.enum';
import { encodeBinanceAccountId } from '../util/binance-account-id.util';

import { BinanceEarnDayBucket } from './binance-earn-day-bucket';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceC2cOrderApiInterface } from '../interface/binance-c2c-order-api.schema';
import type { BinanceConvertFlowApiInterface } from '../interface/binance-convert-api.schema';
import type { BinanceDepositApiInterface } from '../interface/binance-deposit-api.schema';
import type { BinanceEarnRewardApiInterface } from '../interface/binance-earn-reward-api.schema';
import type { BinanceFiatOrderApiInterface } from '../interface/binance-fiat-order-api.schema';
import type { BinanceTradeApiInterface } from '../interface/binance-trade-api.schema';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { BinanceWithdrawalApiInterface } from '../interface/binance-withdrawal-api.schema';

const MICRO_UNITS_DECIMALS = 6;
const DECIMAL_DIGITS_PATTERN = /^\d+$/u;
const MILLISECONDS_PER_SECOND = 1000;
const C2C_BUY_TRADE_TYPE = 'BUY';
const EARN_DATE_PART_DIGITS = 2;

class BinanceMapper {
    mapBalanceToAccount(asset: string, wallet: BinanceWalletEnum, balance: number): SyncAccountInterface {
        return {
            id: encodeBinanceAccountId({ wallet, asset }),
            provider: SyncProviderEnum.BINANCE,
            currencyCode: asset,
            currencyCodeNumeric: BINANCE_NO_NUMERIC_CODE,
            balance,
            balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
            creditLimit: 0,
            type: SyncAccountTypeEnum.CRYPTO,
            title: `Binance ${wallet} · ${asset}`
        };
    }

    mapUnrepresentableBalanceToAccount(asset: string, wallet: BinanceWalletEnum): SyncAccountInterface {
        return {
            ...this.mapBalanceToAccount(asset, wallet, 0),
            balanceState: SyncAccountBalanceStateEnum.UNREPRESENTABLE
        };
    }

    mapDepositToTransaction(deposit: BinanceDepositApiInterface, accountId: string): SyncTransactionInterface | null {
        const amount = this.parseBinanceAmount(deposit.amount);
        if (!isDefined(amount)) {
            return null;
        }

        const externalId = this.buildDepositExternalId(deposit);
        const time = Math.floor(deposit.insertTime / MILLISECONDS_PER_SECOND);

        return {
            ...this.buildBaseTransaction(externalId, accountId, deposit.coin, time),
            type: SyncTransactionTypeEnum.INCOME,
            description: `Binance ${deposit.coin} deposit`,
            amount,
            operationAmount: amount,
            feeAmount: 0
        };
    }

    mapWithdrawalToTransaction(withdrawal: BinanceWithdrawalApiInterface, accountId: string): SyncTransactionInterface | null {
        const amount = this.parseBinanceAmount(withdrawal.amount);
        const fee = this.parseBinanceAmount(withdrawal.transactionFee);
        if (!isDefined(amount) || !isDefined(fee)) {
            return null;
        }

        const feeAmount = fee >= amount ? 0 : fee;
        const time = getUnixTime(new Date(withdrawal.applyTime));

        return {
            ...this.buildBaseTransaction(withdrawal.id, accountId, withdrawal.coin, time),
            type: SyncTransactionTypeEnum.EXPENSE,
            description: `Binance ${withdrawal.coin} withdrawal`,
            amount,
            operationAmount: amount - feeAmount,
            feeAmount
        };
    }

    mapFiatOrderToTransaction(order: BinanceFiatOrderApiInterface, accountId: string, isDeposit: boolean): SyncTransactionInterface | null {
        const amount = this.parseBinanceAmount(order.amount);
        const fee = this.parseBinanceAmount(order.totalFee);
        if (!isDefined(amount) || !isDefined(fee)) {
            return null;
        }

        const feeAmount = fee >= amount ? 0 : fee;
        const time = Math.floor(order.createTime / MILLISECONDS_PER_SECOND);
        const description = isDeposit ? `Binance ${order.fiatCurrency} deposit` : `Binance ${order.fiatCurrency} withdrawal`;

        return {
            ...this.buildBaseTransaction(order.orderNo, accountId, order.fiatCurrency, time),
            type: isDeposit ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE,
            description,
            amount,
            operationAmount: amount - feeAmount,
            feeAmount
        };
    }

    mapC2cOrderToTransaction(order: BinanceC2cOrderApiInterface, accountId: string): SyncTransactionInterface | null {
        const amount = this.parseBinanceAmount(order.amount);
        const quotedAmount = this.parseBinanceAmount(order.totalPrice);
        const quotedUnitPrice = this.parseBinanceAmount(order.unitPrice);
        if (!isDefined(amount) || !isDefined(quotedAmount) || !isDefined(quotedUnitPrice)) {
            return null;
        }

        const isBuy = order.tradeType === C2C_BUY_TRADE_TYPE;
        const externalId = `binance:c2c:${order.orderNumber}`;
        const time = Math.floor(order.createTime / MILLISECONDS_PER_SECOND);
        const description = isBuy ? `Binance P2P buy ${order.asset}` : `Binance P2P sell ${order.asset}`;

        return {
            ...this.buildBaseTransaction(externalId, accountId, order.asset, time),
            type: isBuy ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE,
            description,
            amount,
            operationAmount: amount,
            feeAmount: 0,
            quotedCurrencyCode: order.fiat,
            quotedAmount,
            quotedUnitPrice
        };
    }

    mapTradeToTransfer(trade: BinanceTradeApiInterface, baseAsset: string, quoteAsset: string): BinanceTransferInterface | null {
        const baseAmount = this.parseBinanceAmount(trade.qty);
        const quoteAmount = this.parseBinanceAmount(trade.quoteQty);
        const feeAmount = this.parseBinanceAmount(trade.commission);
        if (!isDefined(baseAmount) || !isDefined(quoteAmount) || !isDefined(feeAmount)) {
            return null;
        }

        const baseAccountId = this.encodeSpotAccountId(baseAsset);
        const quoteAccountId = this.encodeSpotAccountId(quoteAsset);
        const fromAssetAccountId = trade.isBuyer ? quoteAccountId : baseAccountId;
        const toAssetAccountId = trade.isBuyer ? baseAccountId : quoteAccountId;
        const fromAmount = trade.isBuyer ? quoteAmount : baseAmount;
        const toAmount = trade.isBuyer ? baseAmount : quoteAmount;

        return {
            externalId: `binance:trade:${trade.symbol}:${trade.id}`,
            fromAssetAccountId,
            toAssetAccountId,
            fromAmount,
            toAmount,
            feeAssetAccountId: feeAmount > 0 ? this.encodeSpotAccountId(trade.commissionAsset) : null,
            feeAmount,
            time: Math.floor(trade.time / MILLISECONDS_PER_SECOND),
            description: `Binance ${trade.symbol} ${trade.isBuyer ? 'buy' : 'sell'}`,
            source: BinanceTransferSourceEnum.SPOT_TRADE
        };
    }

    mapConvertToTransfer(flow: BinanceConvertFlowApiInterface): BinanceTransferInterface | null {
        const fromAmount = this.parseBinanceAmount(flow.fromAmount);
        const toAmount = this.parseBinanceAmount(flow.toAmount);
        if (!isDefined(fromAmount) || !isDefined(toAmount)) {
            return null;
        }

        return {
            externalId: `binance:convert:${flow.orderId}`,
            fromAssetAccountId: this.encodeSpotAccountId(flow.fromAsset),
            toAssetAccountId: this.encodeSpotAccountId(flow.toAsset),
            fromAmount,
            toAmount,
            feeAssetAccountId: null,
            feeAmount: 0,
            time: Math.floor(flow.createTime / MILLISECONDS_PER_SECOND),
            description: `Binance convert ${flow.fromAsset} to ${flow.toAsset}`,
            source: BinanceTransferSourceEnum.CONVERT
        };
    }

    mapEarnRewardsToTransactions(
        asset: string,
        accountId: string,
        rewards: readonly BinanceEarnRewardApiInterface[]
    ): SyncTransactionInterface[] {
        const dailyBuckets = this.groupEarnRewardsByDay(rewards);

        return [...dailyBuckets.values()].map(bucket => this.mapEarnDayBucket(asset, accountId, bucket)).filter(isDefined);
    }

    parseBinanceAmount(value: string): number | null {
        const parts = this.splitDecimalParts(value);
        if (!isDefined(parts)) {
            return null;
        }

        const truncatedFraction = parts.fractionalPart.slice(0, MICRO_UNITS_DECIMALS).padEnd(MICRO_UNITS_DECIMALS, '0');
        const wholeMicroUnits = BigInt(parts.integerPart) * BigInt(BINANCE_MICRO_UNITS_PRECISION);
        const totalMicroUnits = wholeMicroUnits + BigInt(truncatedFraction);
        if (totalMicroUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
            return null;
        }

        return Number(totalMicroUnits) / BINANCE_MICRO_UNITS_PRECISION;
    }

    private groupEarnRewardsByDay(rewards: readonly BinanceEarnRewardApiInterface[]): Map<string, BinanceEarnDayBucket> {
        const buckets = new Map<string, BinanceEarnDayBucket>();
        for (const reward of rewards) {
            const dayKey = this.buildEarnDayKey(reward.time);
            const rewardMicroUnits = this.parseEarnRewardMicroUnits(reward.rewards);
            const bucket = buckets.get(dayKey) ?? new BinanceEarnDayBucket(dayKey);
            buckets.set(dayKey, bucket.add(rewardMicroUnits, reward.time));
        }

        return buckets;
    }

    private mapEarnDayBucket(asset: string, accountId: string, bucket: BinanceEarnDayBucket): SyncTransactionInterface | null {
        if (bucket.totalMicroUnits <= 0) {
            return null;
        }

        const amount = bucket.totalMicroUnits / BINANCE_MICRO_UNITS_PRECISION;
        const externalId = `binance:earn:${asset}:${bucket.dayKey}`;
        const time = Math.floor(bucket.lastRewardTime / MILLISECONDS_PER_SECOND);

        return {
            ...this.buildBaseTransaction(externalId, accountId, asset, time),
            type: SyncTransactionTypeEnum.INCOME,
            description: `Binance Earn reward ${asset}`,
            amount,
            operationAmount: amount,
            feeAmount: 0
        };
    }

    private parseEarnRewardMicroUnits(value: string): number {
        const amount = this.parseBinanceAmount(value);

        return isDefined(amount) && amount > 0 ? Math.round(amount * BINANCE_MICRO_UNITS_PRECISION) : 0;
    }

    private buildEarnDayKey(timeMs: number): string {
        const date = new Date(timeMs);
        const year = date.getUTCFullYear();
        const month = `${date.getUTCMonth() + 1}`.padStart(EARN_DATE_PART_DIGITS, '0');
        const day = `${date.getUTCDate()}`.padStart(EARN_DATE_PART_DIGITS, '0');

        return `${year}-${month}-${day}`;
    }

    private encodeSpotAccountId(asset: string): string {
        return encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset });
    }

    private buildBaseTransaction(
        externalId: string,
        accountId: string,
        coin: string,
        time: number
    ): Omit<SyncTransactionInterface, 'type' | 'description' | 'amount' | 'operationAmount' | 'feeAmount'> {
        return {
            id: externalId,
            provider: SyncProviderEnum.BINANCE,
            accountId,
            time,
            mcc: 0,
            originalMcc: 0,
            currencyCode: BINANCE_NO_NUMERIC_CODE,
            commissionRate: 0,
            cashbackAmount: 0,
            balance: 0,
            hold: false,
            category: coin
        };
    }

    private buildDepositExternalId(deposit: BinanceDepositApiInterface): string {
        if (isNotEmptyString(deposit.id)) {
            return deposit.id;
        }

        if (isNotEmptyString(deposit.txId)) {
            return deposit.txId;
        }

        return `${deposit.coin}-${deposit.insertTime}-${deposit.amount}`;
    }

    private splitDecimalParts(value: string): { integerPart: string; fractionalPart: string } | null {
        if (!isNotEmptyString(value)) {
            return null;
        }

        const [integerPart, fractionalPart = ''] = value.trim().split('.');
        const isIntegerValid = DECIMAL_DIGITS_PATTERN.test(integerPart);
        const isFractionValid = !isNotEmptyString(fractionalPart) || DECIMAL_DIGITS_PATTERN.test(fractionalPart);

        return isIntegerValid && isFractionValid ? { integerPart, fractionalPart } : null;
    }
}

export const binanceMapper = new BinanceMapper();
