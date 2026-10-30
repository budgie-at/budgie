import { isDefined } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { BinanceTransferSourceEnum } from '../enum/binance-transfer-source.enum';

import { encodeSpotAccountId, parseUnsignedAmount, toSyncTransaction, toUnixSeconds } from './binance.mapper';

import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceFiatPaymentApiInterface } from '../interface/binance-fiat-payment-api.schema';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';

const FIAT_BALANCE_PAYMENT_PATTERN = /balance/iu;

const isFiatBalancePayment = (payment: BinanceFiatPaymentApiInterface): boolean =>
    FIAT_BALANCE_PAYMENT_PATTERN.test(payment.paymentMethod ?? '');

export const mapBinanceFiatPaymentToTransaction = (
    payment: BinanceFiatPaymentApiInterface,
    accountId: string
): SyncTransactionInterface | null => {
    const amount = parseUnsignedAmount(payment.obtainAmount);
    const quotedAmount = parseUnsignedAmount(payment.sourceAmount);
    const quotedUnitPrice = parseUnsignedAmount(payment.price);

    return !isFiatBalancePayment(payment) && isDefined(amount) && isDefined(quotedAmount) && isDefined(quotedUnitPrice)
        ? toSyncTransaction({
              id: `binance:fiat-payment:${payment.orderNo}`,
              accountId,
              category: payment.cryptoCurrency,
              time: toUnixSeconds(payment.createTime),
              type: SyncTransactionTypeEnum.INCOME,
              description: `Binance card buy ${payment.cryptoCurrency}`,
              amount,
              feeAmount: 0,
              quotedCurrencyCode: payment.fiatCurrency,
              quotedAmount,
              quotedUnitPrice
          })
        : null;
};

export const mapBinanceFiatPaymentToTransfer = (payment: BinanceFiatPaymentApiInterface): BinanceTransferInterface | null => {
    const fromAmount = parseUnsignedAmount(payment.sourceAmount);
    const toAmount = parseUnsignedAmount(payment.obtainAmount);

    return isFiatBalancePayment(payment) && isDefined(fromAmount) && isDefined(toAmount)
        ? {
              externalId: `binance:fiat-payment:${payment.orderNo}`,
              fromAssetAccountId: encodeSpotAccountId(payment.fiatCurrency),
              toAssetAccountId: encodeSpotAccountId(payment.cryptoCurrency),
              fromAmount,
              toAmount,
              feeAssetAccountId: null,
              feeAmount: 0,
              time: toUnixSeconds(payment.createTime),
              description: `Binance buy ${payment.cryptoCurrency} with ${payment.fiatCurrency}`,
              source: BinanceTransferSourceEnum.FIAT_PAYMENT
          }
        : null;
};
