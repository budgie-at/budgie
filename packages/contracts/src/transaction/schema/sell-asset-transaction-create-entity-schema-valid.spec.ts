import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { SellAssetTransactionCreateEntitySchema } from './sell-asset-transaction-create-entity.schema';

describe('SellAssetTransactionCreateEntitySchema – valid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    const ONE_SCALED = convertToMicroUnits(1);

    it('2 entries (no fee), balances exactly in TO currency', () => {
        const conversionRate = convertToMicroUnits(42.26);
        const fromAmount = convertToMicroUnits(5000.0);
        const toAmount = (fromAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries (with fee debit), balances exactly: proceeds = convertedFrom − fee', () => {
        const conversionRate = convertToMicroUnits(1.17);
        const fromAmount = convertToMicroUnits(2000.0);

        const converted = (fromAmount * conversionRate) / ONE_SCALED;
        const fee = convertToMicroUnits(12.5);
        const toAmount = converted - fee;

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${BigInt(TOLERANCE_MICRO).toString()} micro)`, () => {
        const conversionRate = convertToMicroUnits(156.07);
        const fromAmount = convertToMicroUnits(3000.0);

        const converted = (fromAmount * conversionRate) / ONE_SCALED;
        const fee = convertToMicroUnits(20.0);
        const toAmount = converted - fee + BigInt(TOLERANCE_MICRO);

        const payload = createTransferTransactionInput({
            amount: toAmount,
            exchangeRate: conversionRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
