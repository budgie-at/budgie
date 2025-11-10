import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { PRECISION } from '../constant/precision.constant';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferTransactionCreateEntitySchema } from './transfer-transaction-create-entity.schema';

const convertToFromMicro = (toAmountMicro: number, exchangeRate: number): number => {
    const rateScaledInteger = Math.round(exchangeRate * PRECISION);

    return Math.round((toAmountMicro * rateScaledInteger) / PRECISION);
};

describe('TransferTransactionCreateEntitySchema (Zod, end-to-end)', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('2 entries, balances exactly in FROM currency', () => {
        const exchangeRate = 90_000.123456;
        const toAmountMicro = 1_000_000;
        const fromAmountMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries with fee (DEBIT in FROM), balances exactly: from = converted(to) + fee', () => {
        const exchangeRate = 12_345.678901;
        const toAmountMicro = 2_500_000;
        const feeMicro = 30_000_000;
        const convertedToInFromMicro = convertToFromMicro(toAmountMicro, exchangeRate);
        const fromAmountMicro = convertedToInFromMicro + feeMicro;

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${TOLERANCE_MICRO.toString()} micro)`, () => {
        const exchangeRate = 7_777.777777;
        const toAmountMicro = 10_000_000;
        const feeMicro = 1_000_000;
        const convertedToInFromMicro = convertToFromMicro(toAmountMicro, exchangeRate);

        const fromAmountMicro = convertedToInFromMicro + feeMicro - TOLERANCE_MICRO;

        const payload = createTransferTransactionInput({
            exchangeRate,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro),
                createTransferTransactionEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = TransferTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
