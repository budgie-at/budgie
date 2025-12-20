import { describe, expect, it } from '@jest/globals';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createIncomeTransactionInput } from '../../test-utils/create-income-transaction-input.util';
import { createTransactionEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { IncomeTransactionCreateEntitySchema } from './income-transaction-create-entity.schema';

describe('IncomeTransactionCreateEntitySchema – invalid cases', () => {
    it("any entry that isn't 'debit' is rejected", () => {
        const totalAmount = convertToMicroUnits(3340.75);

        const payload = createIncomeTransactionInput({
            amount: totalAmount,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(2450.75), 101),
                createTransactionEntryInput(TransactionEntryTypeEnum.CREDIT, convertToMicroUnits(890.0), 102)
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
            amount: convertToMicroUnits(0),
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
            amount: convertToMicroUnits(-10),
            [TransactionAssociationEnum.ENTRIES]: [createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, convertToMicroUnits(-10), 101)]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);

        expect(result.success).toBe(false);

        const error = isDefined(result.error) ? prettifyError(result.error) : '';

        expect(error).toContain('Too small: expected bigint to be >0');
        expect(error).toContain(`at ${TransactionAssociationEnum.ENTRIES}[0].amount`);
    });
});
