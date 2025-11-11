import { describe, expect, it } from '@jest/globals';

import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { quoteMicroToBaseMicro } from '../../test-utils/quote-micro-to-base-micro.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BuyAssetTransactionCreateEntitySchema } from './buy-asset-transaction-create-entity.schema';

describe('BuyAssetTransactionCreateEntitySchema (Zod, end-to-end)', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('2 entries (no fee), balances exactly', () => {
        const exchangeRate = 90_000.123456;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = quoteMicroToBaseMicro(toAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries (with fee), balances exactly', () => {
        const exchangeRate = 12_345.678901;
        const toAmountMicro = 2_500_000;
        const feeMicro = 30_000_000;
        const convertedToInFromMicro = quoteMicroToBaseMicro(toAmountMicro, exchangeRate);
        const fromAmountMicro = convertedToInFromMicro + feeMicro;

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${TOLERANCE_MICRO.toString()} micro)`, () => {
        const exchangeRate = 7_777.777777;
        const toAmountMicro = 10_000_000;
        const feeMicro = 1_000_000;
        const convertedToInFromMicro = quoteMicroToBaseMicro(toAmountMicro, exchangeRate);
        const fromAmountMicro = convertedToInFromMicro + feeMicro - TOLERANCE_MICRO;

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
