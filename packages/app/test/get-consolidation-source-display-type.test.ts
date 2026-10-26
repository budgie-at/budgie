import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { getConsolidationSourceDisplayType } from '../src/transaction/utils/get-consolidation-source-display-type.util';

describe('getConsolidationSourceDisplayType', () => {
    it.each([
        [TransactionEntryTypeEnum.CREDIT, TransactionTypeEnum.EXPENSE],
        [TransactionEntryTypeEnum.FEE, TransactionTypeEnum.EXPENSE],
        [TransactionEntryTypeEnum.DEBIT, TransactionTypeEnum.INCOME]
    ])('shows a %s source entry of an ATM cash withdrawal as %s', (entryType, expected) => {
        expect(
            getConsolidationSourceDisplayType(
                { entryType, sourceType: TransactionTypeEnum.EXPENSE },
                TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL
            )
        ).toBe(expected);
    });
});
