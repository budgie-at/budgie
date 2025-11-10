import { createEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { createTransactionInput } from '../../test-utils/create-transaction-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TOLERANCE_MICRO } from '../constant/tolerance-micro.constant';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransferAssetTransactionCreateEntitySchema } from './transfer-asset-transaction-create-entity.schema';

describe('TransferAssetTransactionCreateEntitySchema (Zod, end-to-end)', () => {
    const fromAccountId = 11;
    const toAccountId = 22;
    const feeAccountId = 33;

    it('2 entries (no fee), balances exactly (from = to), exchangeRate = 1', () => {
        const amount = 5_000_000;
        const payload = createTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, amount),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, amount)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('3 entries (with fee), balances exactly (from = to + fee), exchangeRate = 1', () => {
        const toMicro = 4_000_000;
        const feeMicro = 100_000;
        const fromMicro = toMicro + feeMicro;

        const payload = createTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromMicro),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toMicro),
                createEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it(`within tolerance (±${TOLERANCE_MICRO})`, () => {
        const toMicro = 1_000_000;
        const feeMicro = 500_000;
        const fromMicro = toMicro + feeMicro - TOLERANCE_MICRO;

        const payload = createTransactionInput({
            exchangeRate: 1,
            fromAccountId,
            toAccountId,
            [TransactionAssociationEnum.ENTRIES]: [
                createEntryInput(fromAccountId, TransactionEntryTypeEnum.CREDIT, fromMicro),
                createEntryInput(toAccountId, TransactionEntryTypeEnum.DEBIT, toMicro),
                createEntryInput(feeAccountId, TransactionEntryTypeEnum.DEBIT, feeMicro)
            ]
        });

        const result = TransferAssetTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
