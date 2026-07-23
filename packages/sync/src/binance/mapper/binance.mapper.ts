/* eslint-disable max-lines -- File owns the single BinanceMapper class; package rule mandates one mapper class per provider, splitting would fragment it -- approved by human */
import { Log } from '@budgie/logger';
import { getUnixTime } from 'date-fns';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { BINANCE_NO_NUMERIC_CODE } from '../constant/binance-no-numeric-code.constant';
import { BINANCE_MICRO_UNITS_PRECISION } from '../constant/binance-precision.constant';
import { BinanceTransferSourceEnum } from '../enum/binance-transfer-source.enum';
import { BinanceWalletEnum } from '../enum/binance-wallet.enum';
import { encodeBinanceAccountId } from '../util/binance-account-id.util';

import { BinanceEarnMonthBucket } from './binance-earn-month-bucket';

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
const EARN_MONTH_DIGITS = 2;

class BinanceMapper {
    @Log(
        (asset, wallet, balance) => `enter wallet=${wallet} asset=${asset} balance=${balance}`,
        (result, asset, wallet) => `done wallet=${wallet} asset=${asset} accountId=${result.id}`,
        (error, asset, wallet, balance) => `throw wallet=${wallet} asset=${asset} balance=${balance} error=${getErrorMessage(error)}`
    )
    mapBalanceToAccount(asset: string, wallet: BinanceWalletEnum, balance: number): SyncAccountInterface {
        return {
            id: encodeBinanceAccountId({ wallet, asset }),
            provider: SyncProviderEnum.BINANCE,
            currencyCode: asset,
            currencyCodeNumeric: BINANCE_NO_NUMERIC_CODE,
            balance,
            creditLimit: 0,
            type: SyncAccountTypeEnum.CRYPTO,
            title: `Binance ${wallet} · ${asset}`
        };
    }

    @Log(
        (deposit, accountId) => `enter accountId=${accountId} coin=${deposit.coin} amount=${deposit.amount}`,
        (result, deposit, accountId) => `done accountId=${accountId} coin=${deposit.coin} skipped=${String(!isDefined(result))}`,
        (error, deposit, accountId) => `throw accountId=${accountId} coin=${deposit.coin} error=${getErrorMessage(error)}`
    )
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

    @Log(
        (withdrawal, accountId) =>
            `enter accountId=${accountId} coin=${withdrawal.coin} amount=${withdrawal.amount} fee=${withdrawal.transactionFee}`,
        (result, withdrawal, accountId) => `done accountId=${accountId} coin=${withdrawal.coin} skipped=${String(!isDefined(result))}`,
        (error, withdrawal, accountId) => `throw accountId=${accountId} coin=${withdrawal.coin} error=${getErrorMessage(error)}`
    )
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

    @Log(
        (order, accountId, isDeposit) =>
            `enter accountId=${accountId} fiatCurrency=${order.fiatCurrency} amount=${order.amount} fee=${order.totalFee} isDeposit=${String(isDeposit)}`,
        (result, order, accountId) =>
            `done accountId=${accountId} fiatCurrency=${order.fiatCurrency} skipped=${String(!isDefined(result))}`,
        (error, order, accountId) => `throw accountId=${accountId} fiatCurrency=${order.fiatCurrency} error=${getErrorMessage(error)}`
    )
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

    @Log(
        (order, accountId) =>
            `enter accountId=${accountId} orderNumber=${order.orderNumber} tradeType=${order.tradeType} asset=${order.asset}`,
        (result, order, accountId) => `done accountId=${accountId} orderNumber=${order.orderNumber} skipped=${String(!isDefined(result))}`,
        (error, order, accountId) => `throw accountId=${accountId} orderNumber=${order.orderNumber} error=${getErrorMessage(error)}`
    )
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

    @Log(
        (trade, baseAsset, quoteAsset) =>
            `enter symbol=${trade.symbol} base=${baseAsset} quote=${quoteAsset} tradeId=${trade.id} isBuyer=${String(trade.isBuyer)}`,
        (result, trade) => `done tradeId=${trade.id} skipped=${String(!isDefined(result))}`,
        (error, trade) => `throw tradeId=${trade.id} error=${getErrorMessage(error)}`
    )
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

    @Log(
        flow => `enter orderId=${flow.orderId} fromAsset=${flow.fromAsset} toAsset=${flow.toAsset}`,
        (result, flow) => `done orderId=${flow.orderId} skipped=${String(!isDefined(result))}`,
        (error, flow) => `throw orderId=${flow.orderId} error=${getErrorMessage(error)}`
    )
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

    @Log(
        (asset, accountId, rewards) => `enter accountId=${accountId} asset=${asset} rewardCount=${rewards.length}`,
        (result, asset, accountId) => `done accountId=${accountId} asset=${asset} transactionCount=${result.length}`,
        (error, asset, accountId) => `throw accountId=${accountId} asset=${asset} error=${getErrorMessage(error)}`
    )
    mapEarnRewardsToTransactions(asset: string, accountId: string, rewards: BinanceEarnRewardApiInterface[]): SyncTransactionInterface[] {
        const monthlyBuckets = this.groupEarnRewardsByMonth(rewards);

        return [...monthlyBuckets.values()].map(bucket => this.mapEarnMonthBucket(asset, accountId, bucket)).filter(isDefined);
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

    private groupEarnRewardsByMonth(rewards: BinanceEarnRewardApiInterface[]): Map<string, BinanceEarnMonthBucket> {
        const buckets = new Map<string, BinanceEarnMonthBucket>();
        for (const reward of rewards) {
            const monthKey = this.buildEarnMonthKey(reward.time);
            const rewardMicroUnits = this.parseEarnRewardMicroUnits(reward.rewards);
            const bucket = buckets.get(monthKey) ?? new BinanceEarnMonthBucket(monthKey);
            bucket.add(rewardMicroUnits, reward.time);
            buckets.set(monthKey, bucket);
        }

        return buckets;
    }

    private mapEarnMonthBucket(asset: string, accountId: string, bucket: BinanceEarnMonthBucket): SyncTransactionInterface | null {
        if (bucket.totalMicroUnits <= 0) {
            return null;
        }

        const amount = bucket.totalMicroUnits / BINANCE_MICRO_UNITS_PRECISION;
        const externalId = `binance:earn:${asset}:${bucket.monthKey}`;
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

    private buildEarnMonthKey(timeMs: number): string {
        const date = new Date(timeMs);
        const year = date.getUTCFullYear();
        const month = `${date.getUTCMonth() + 1}`.padStart(EARN_MONTH_DIGITS, '0');

        return `${year}-${month}`;
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
