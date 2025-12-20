import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { BuyAssetTransactionCreateEntitySchema } from './buy-asset-transaction-create-entity.schema';

describe('BuyAssetTransactionCreateEntitySchema – valid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    const ONE_SCALED = convertToMicroUnits(1);

    it('2 entries (no fee), balances exactly', () => {
        const exchangeRate = convertToMicroUnits(42.26);
        const toAmount = convertToMicroUnits(5000.0);
        const fromAmount = (toAmount * exchangeRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries (with fee), balances exactly', () => {
        const exchangeRate = convertToMicroUnits(1.17);
        const toAmount = convertToMicroUnits(2000.0);
        const fee = convertToMicroUnits(15.0);

        const converted = (toAmount * exchangeRate) / ONE_SCALED;
        const fromAmount = converted + fee;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${BigInt(TOLERANCE_MICRO).toString()} micro)`, () => {
        const exchangeRate = convertToMicroUnits(156.07);
        const toAmount = convertToMicroUnits(3000.0);
        const fee = convertToMicroUnits(25.0);

        const converted = (toAmount * exchangeRate) / ONE_SCALED;
        const fromAmount = converted + fee - BigInt(TOLERANCE_MICRO);

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = BuyAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
