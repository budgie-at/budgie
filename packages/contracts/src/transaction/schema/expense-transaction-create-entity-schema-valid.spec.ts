import { describe, expect, it } from '@jest/globals';

import { createExpenseTransactionInput } from '../../test-utils/create-expense-transaction-input.util';
import { createTransactionEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { ExpenseTransactionCreateEntitySchema } from './expense-transaction-create-entity.schema';

describe('ExpenseTransactionCreateEntitySchema (only CREDIT entries + unique categoryId, min 1)', () => {
    it('single credit entry with unique category', () => {
        const payload = createExpenseTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: [createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, 1_000_000, 101)]
        });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('multiple credit entries (splits) with unique categories', () => {
        const payload = createExpenseTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, 600_000, 101),
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, 300_000, 102),
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, 100_000, 103)
            ]
        });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
