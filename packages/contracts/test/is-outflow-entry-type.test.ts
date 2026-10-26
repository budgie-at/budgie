import { describe, expect, it } from '@effect/vitest';

import { TransactionEntryTypeEnum } from '../src/transaction-entry/enum/transaction-entry-type.enum';
import { isOutflowEntryType } from '../src/transaction-entry/utils/is-outflow-entry-type.util';

describe('isOutflowEntryType', () => {
    it.each([
        [TransactionEntryTypeEnum.CREDIT, true],
        [TransactionEntryTypeEnum.FEE, true],
        [TransactionEntryTypeEnum.DEBIT, false]
    ])('classifies %s as outflow=%s', (type, expected) => {
        expect(isOutflowEntryType(type)).toBe(expected);
    });
});
