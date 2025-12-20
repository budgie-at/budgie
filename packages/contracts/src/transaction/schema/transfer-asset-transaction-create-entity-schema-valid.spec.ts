import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferAssetTransactionCreateEntitySchema } from './transfer-asset-transaction-create-entity.schema';

describe('TransferAssetTransactionCreateEntitySchema – valid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('2 entries (no fee), balances exactly (from = to), exchangeRate = 1', () => {
        const amount = convertToMicroUnits(2450.75);

        const payload = createTransferTransactionInput({
            amount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, amount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, amount)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries (with fee), balances exactly (from = to + fee), exchangeRate = 1', () => {
        const toAmount = convertToMicroUnits(2000.0);
        const fee = convertToMicroUnits(15.5);
        const fromAmount = toAmount + fee;

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${BigInt(TOLERANCE_MICRO).toString()} micro)`, () => {
        const toAmount = convertToMicroUnits(1275.0);
        const fee = convertToMicroUnits(8.75);
        const fromAmount = toAmount + fee - BigInt(TOLERANCE_MICRO);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: convertToMicroUnits(1),
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
