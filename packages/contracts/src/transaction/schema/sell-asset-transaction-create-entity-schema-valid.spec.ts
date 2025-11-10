import { createTransferTransactionEntryInput } from '../../test-utils/create-transfer-transaction-entry-input.util';
import { createTransferTransactionInput } from '../../test-utils/create-transfer-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { SellAssetTransactionCreateEntitySchema } from './sell-asset-transaction-create-entity.schema';
import { convertFromToMicro } from '../../test-utils/convert-from-to-micro.util';

describe('SellAssetTransactionCreateEntitySchema (Zod, end-to-end)', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('2 entries (no fee), balances exactly in TO currency', () => {
        const exchangeRate = 90_000.123456;
        const fromAmountMicro = 1_000_000;
        const toAmountMicro = convertFromToMicro(fromAmountMicro, exchangeRate);

        const payload = createTransferTransactionInput({
            exchangeRate,
            toAccountId,
            fromAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransferTransactionEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromAmountMicro),
                createTransferTransactionEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toAmountMicro)
            ]
        });

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries (with fee debit), balances exactly: proceeds = convertedFrom − fee', () => {
        const exchangeRate = 12_345.678901;
        const fromAmountMicro = 5_000_000;
        const convertedFromToMicro = convertFromToMicro(fromAmountMicro, exchangeRate);

        const feeMicro = Math.max(1, Math.floor(convertedFromToMicro / 10));
        const toAmountMicro = convertedFromToMicro - feeMicro;
        expect(toAmountMicro).toBeGreaterThanOrEqual(0);

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

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${TOLERANCE_MICRO} micro)`, () => {
        const exchangeRate = 7_777.777777;
        const fromAmountMicro = 10_000_000;
        const convertedFromToMicro = convertFromToMicro(fromAmountMicro, exchangeRate);
        const feeMicro = Math.max(1, Math.floor(convertedFromToMicro / 20));

        const toAmountMicro = convertedFromToMicro - feeMicro + TOLERANCE_MICRO;

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

        const result = SellAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
