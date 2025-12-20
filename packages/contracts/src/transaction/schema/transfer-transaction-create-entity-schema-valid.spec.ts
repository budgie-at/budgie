import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferTransactionCreateEntitySchema } from './transfer-transaction-create-entity.schema';

describe('TransferTransactionCreateEntitySchema – valid cases', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    const ONE_SCALED = convertToMicroUnits(1);

    it('2 entries, balances exactly in FROM currency', () => {
        const conversionRate = convertToMicroUnits(42.26);
        const toAmount = convertToMicroUnits(2450.75);
        const fromAmount = (toAmount * conversionRate) / ONE_SCALED;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries with fee (DEBIT in FROM), balances exactly: from = converted(to) + fee', () => {
        const conversionRate = convertToMicroUnits(1.17);
        const toAmount = convertToMicroUnits(2000.0);
        const fee = convertToMicroUnits(18.5);

        const converted = (toAmount * conversionRate) / ONE_SCALED;
        const fromAmount = converted + fee;

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${BigInt(TOLERANCE_MICRO).toString()} micro)`, () => {
        const conversionRate = convertToMicroUnits(156.07);
        const toAmount = convertToMicroUnits(800.0);
        const fee = convertToMicroUnits(12.0);

        const converted = (toAmount * conversionRate) / ONE_SCALED;
        const fromAmount = converted + fee - BigInt(TOLERANCE_MICRO);

        const payload = createTransferTransactionInput({
            amount: fromAmount,
            exchangeRate: conversionRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmount),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmount),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, fee)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
