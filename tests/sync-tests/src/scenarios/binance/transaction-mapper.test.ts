import { SyncTransactionTypeEnum, binanceMapper } from '@budgie/sync';
import { isDefined } from '@rnw-community/shared';
import { describe, expect, it } from 'vitest';

import { buildBinance } from '../../harness';

const ACCOUNT_ID = 'SPOT:BTC';

describe('binance/transaction-mapper', () => {
    it('maps a deposit to INCOME with no fee and operationAmount equal to amount', () => {
        const transaction = binanceMapper.mapDepositToTransaction(buildBinance.deposit({ coin: 'BTC', amount: '2' }), ACCOUNT_ID);

        expect(isDefined(transaction)).toBe(true);
        expect(transaction?.type).toBe(SyncTransactionTypeEnum.INCOME);
        expect(transaction?.amount).toBe(2);
        expect(transaction?.feeAmount).toBe(0);
        expect(transaction?.operationAmount).toBe(2);
    });

    it('maps a fee-bearing withdrawal to EXPENSE with gross amount and net operationAmount', () => {
        const transaction = binanceMapper.mapWithdrawalToTransaction(
            buildBinance.withdrawal({ id: 'w-1', coin: 'BTC', amount: '1', transactionFee: '0.1' }),
            ACCOUNT_ID
        );

        expect(transaction?.type).toBe(SyncTransactionTypeEnum.EXPENSE);
        expect(transaction?.amount).toBe(1);
        expect(transaction?.feeAmount).toBe(0.1);
        expect(transaction?.operationAmount).toBeCloseTo(0.9, 10);
    });

    it('reconciles net operationAmount plus fee back to the gross amount', () => {
        const transaction = binanceMapper.mapWithdrawalToTransaction(
            buildBinance.withdrawal({ id: 'w-2', coin: 'BTC', amount: '1', transactionFee: '0.25' }),
            ACCOUNT_ID
        );

        expect(isDefined(transaction)).toBe(true);
        if (isDefined(transaction)) {
            expect(transaction.operationAmount + transaction.feeAmount).toBeCloseTo(transaction.amount, 10);
        }
    });

    it('drops the fee for a degenerate fee >= amount withdrawal', () => {
        const transaction = binanceMapper.mapWithdrawalToTransaction(
            buildBinance.withdrawal({ id: 'w-3', coin: 'BTC', amount: '1', transactionFee: '1' }),
            ACCOUNT_ID
        );

        expect(transaction?.feeAmount).toBe(0);
        expect(transaction?.operationAmount).toBe(1);
        expect(transaction?.amount).toBe(1);
    });

    it('skips a deposit whose microunit amount exceeds MAX_SAFE_INTEGER', () => {
        const transaction = binanceMapper.mapDepositToTransaction(
            buildBinance.deposit({ coin: 'PEPE', amount: '99999999999' }),
            'SPOT:PEPE'
        );

        expect(transaction).toBeNull();
    });
});
