import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    mapBinanceDepositToTransaction,
    mapBinanceWithdrawalToTransaction,
    mapBinanceFiatOrderToTransaction
} from '../src/binance/mapper/binance.mapper';
import { SyncTransactionTypeEnum } from '../src/core/enum/sync-transaction-type.enum';

describe('Binance own capital movements', () => {
    it.effect('maps on-chain deposits and withdrawals as transfers', () =>
        Effect.sync(() => {
            const deposit = mapBinanceDepositToTransaction(
                { id: 'deposit', amount: '42', coin: 'USDT', insertTime: 1_700_000_000_000 },
                'spot'
            );
            const withdrawal = mapBinanceWithdrawalToTransaction(
                { id: 'withdrawal', amount: '42', transactionFee: '1', coin: 'USDT', applyTime: '2026-05-01 12:00:00' },
                'spot'
            );
            expect(deposit?.type).toBe(SyncTransactionTypeEnum.TRANSFER);
            expect(deposit?.transferDirection).toBe(SyncTransactionTypeEnum.INCOME);
            expect(withdrawal?.type).toBe(SyncTransactionTypeEnum.TRANSFER);
            expect(withdrawal?.transferDirection).toBe(SyncTransactionTypeEnum.EXPENSE);
            expect(withdrawal?.operationAmount).toBe(41);
        })
    );
    it.effect('maps fiat deposits and withdrawals as transfers while preserving fees', () =>
        Effect.sync(() => {
            const order = {
                orderNo: 'fiat',
                amount: '42',
                totalFee: '1',
                fiatCurrency: 'EUR',
                status: 'Successful',
                createTime: 1_700_000_000_000
            };
            const deposit = mapBinanceFiatOrderToTransaction(order, 'spot', true);
            const withdrawal = mapBinanceFiatOrderToTransaction(order, 'spot', false);
            expect(deposit?.type).toBe(SyncTransactionTypeEnum.TRANSFER);
            expect(deposit?.operationAmount).toBe(43);
            expect(withdrawal?.type).toBe(SyncTransactionTypeEnum.TRANSFER);
            expect(withdrawal?.operationAmount).toBe(42);
            expect(withdrawal?.feeAmount).toBe(1);
        })
    );
});
