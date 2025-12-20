import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';
import { createExpenseTransactionInput } from '../../test-utils/create-expense-transaction-input.util';

import { ExpenseTransactionCreateEntitySchema } from './expense-transaction-create-entity.schema';

describe('ExpenseTransactionCreateEntitySchema – valid cases', () => {
    it('single credit entry with unique category', () => {
        const totalAmount = convertToMicroUnits(127.43);

        const payload = createExpenseTransactionInput({ amount: totalAmount });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('multiple credit entries (splits) with unique categories', () => {
        const amount1 = convertToMicroUnits(89.9);
        const amount2 = convertToMicroUnits(36.75);
        const amount3 = convertToMicroUnits(14.99);
        const totalAmount = amount1 + amount2 + amount3;

        const payload = createExpenseTransactionInput({ amount: totalAmount });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
