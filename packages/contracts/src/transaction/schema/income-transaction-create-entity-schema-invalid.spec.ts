import { describe, expect, it } from '@jest/globals';

import { createIncomeTransactionInput } from '../../test-utils/create-income-transaction-input.util';
import { createTransactionEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { getZodIssueMessages } from '../../test-utils/get-zod-messages.util';
import { getZodIssuePaths } from '../../test-utils/get-zod-paths.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { IncomeTransactionCreateEntitySchema } from './income-transaction-create-entity.schema';

describe('IncomeTransactionCreateEntitySchema (only DEBIT entries + unique categoryId)', () => {
    it("any entry that isn't 'debit' is rejected", () => {
        const payload = createIncomeTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, 600_000, 101),
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, 400_000, 102)
            ]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain("income entry must be 'debit'");
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 1, 'type']);
    });

    it('zero entries (min 1 enforced)', () => {
        const payload = createIncomeTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: []
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);
        expect(getZodIssueMessages(result).join(' ')).toContain('Too small: expected array to have >=1 items');
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES]);
    });

    it('amount must be positive integer (delegated to entry schema)', () => {
        const payload = createIncomeTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: [createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, 0, 101)]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);
        expect(getZodIssuePaths(result)).toContainEqual([TransactionAssociationEnum.ENTRIES, 0, 'amount']);
    });
});
