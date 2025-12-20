import { describe, expect, it } from '@jest/globals';

import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';
import { createIncomeTransactionInput } from '../../test-utils/create-income-transaction-input.util';

import { IncomeTransactionCreateEntitySchema } from './income-transaction-create-entity.schema';

describe('IncomeTransactionCreateEntitySchema – valid cases', () => {
    it('single debit entry with unique category', () => {
        const totalAmount = convertToMicroUnits(3250.8);

        const payload = createIncomeTransactionInput({ amount: totalAmount });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('multiple debit entries (splits) with unique categories', () => {
        const amount1 = convertToMicroUnits(2800.0);
        const amount2 = convertToMicroUnits(450.0);
        const amount3 = convertToMicroUnits(125.75);
        const totalAmount = amount1 + amount2 + amount3;

        const payload = createIncomeTransactionInput({ amount: totalAmount });

        const result = IncomeTransactionCreateEntitySchema.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
