import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createExpenseTransactionInput } from '../../test-utils/create-expense-transaction-input.util';
import { createTransactionEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { ExpenseTransactionCreateEntitySchema } from './expense-transaction-create-entity.schema';

describe('ExpenseTransactionCreateEntitySchema – invalid cases', () => {
    it("any entry that isn't 'credit' is rejected", () => {
        const totalAmount = convertToMicroUnits(164.18);

        const payload = createExpenseTransactionInput({
            amount: totalAmount,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, convertToMicroUnits(127.43), 101),
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(36.75), 102)
            ]
        });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain("expense entry must be 'credit'");
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[1].type`);
    });

    it('zero entries (min 1 enforced)', () => {
        const payload = createExpenseTransactionInput({
            amount: convertToMicroUnits(0),
            [TransactionAssociationEnum.ENTRIES]: []
        });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected array to have >=1 items');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}`);
    });

    it('amount must be positive (delegated to entry schema)', () => {
        const payload = createExpenseTransactionInput({
            amount: convertToMicroUnits(-10),
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, convertToMicroUnits(-10), 101)
            ]
        });

        const result = ExpenseTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected bigint to be >0');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[0].amount`);
    });
});
