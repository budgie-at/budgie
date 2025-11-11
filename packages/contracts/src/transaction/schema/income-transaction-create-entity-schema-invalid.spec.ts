import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { createIncomeTransactionInput } from '../../test-utils/create-income-transaction-input.util';
import { createTransactionEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { IncomeTransactionCreateEntitySchema } from './income-transaction-create-entity.schema';

describe('IncomeTransactionCreateEntitySchema – invalid cases', () => {
    it("any entry that isn't 'debit' is rejected", () => {
        const payload = createIncomeTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, 600_000, 101),
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, 400_000, 102)
            ]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain("income entry must be 'debit'");
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[1].type`);
    });

    it('zero entries (min 1 enforced)', () => {
        const payload = createIncomeTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: []
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected array to have >=1 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('amount must be positive integer (delegated to entry schema)', () => {
        const payload = createIncomeTransactionInput({
            [TransactionAssociationEnum.ENTRIES]: [createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, 0, 101)]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected number to be >0');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[0].amount`);
    });
});
