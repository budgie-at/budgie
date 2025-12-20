import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micto-units.util';
import { createIncomeTransactionInput } from '../../test-utils/create-income-transaction-input.util';
import { createTransactionEntryInput } from '../../test-utils/create-transaction-entry-input.util';
import { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { IncomeTransactionCreateEntitySchema } from './income-transaction-create-entity.schema';

describe('IncomeTransactionCreateEntitySchema – valid cases', () => {
    it('single debit entry with unique category', () => {
        const totalAmount = convertToMicroUnits(3250.8);

        const payload = createIncomeTransactionInput({
            amount: totalAmount,
            [TransactionAssociationEnum.ENTRIES]: [createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, totalAmount, 101)]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('multiple debit entries (splits) with unique categories', () => {
        const amount1 = convertToMicroUnits(2800.0);
        const amount2 = convertToMicroUnits(450.0);
        const amount3 = convertToMicroUnits(125.75);
        const totalAmount = amount1 + amount2 + amount3;

        const payload = createIncomeTransactionInput({
            amount: totalAmount,
            [TransactionAssociationEnum.ENTRIES]: [
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, amount1, 101),
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, amount2, 102),
                createTransactionEntryInput(TransactionEntryTypeEnum.DEBIT, amount3, 103)
            ]
        });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
