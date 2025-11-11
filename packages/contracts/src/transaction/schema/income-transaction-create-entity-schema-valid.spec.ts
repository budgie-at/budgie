import { describe, expect, it } from '@jest/globals';

import { createIncomeTransactionInput } from '../../test-utils/create-income-transaction-input.util';
import { createTransactionEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { IncomeTransactionCreateEntitySchema } from './income-transaction-create-entity.schema';

describe('IncomeTransactionCreateEntitySchema (only DEBIT entries + unique categoryId)', () => {
    it('single debit entry with unique category', () => {
        const payload = createIncomeTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: [createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, 1_000_000, 101)]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(true);
    });

    it('multiple debit entries (splits) with unique categories', () => {
        const payload = createIncomeTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, 600_000, 101),
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, 300_000, 102),
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, 100_000, 103)
            ]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(true);
    });
});
