import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createExpenseTransactionInput } from '../../test-utils/create-expense-transaction-input.util';
import { createTransactionEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { ExpenseTransactionCreateEntitySchema } from './expense-transaction-create-entity.schema';

describe('ExpenseTransactionCreateEntitySchema – valid cases', () => {
    it('single credit entry with unique category', () => {
        const totalAmount = convertToMicroUnits(127.43);

        const payload = createExpenseTransactionInput({
            amount: totalAmount,
            [TransactionAssociationEnum.ENTRIES]: [createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, totalAmount, 101)]
        });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('multiple credit entries (splits) with unique categories', () => {
        const amount1 = convertToMicroUnits(89.9);
        const amount2 = convertToMicroUnits(36.75);
        const amount3 = convertToMicroUnits(14.99);
        const totalAmount = amount1 + amount2 + amount3;

        const payload = createExpenseTransactionInput({
            amount: totalAmount,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, amount1, 101),
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, amount2, 102),
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, amount3, 103)
            ]
        });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
