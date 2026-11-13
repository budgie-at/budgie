import { TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';

import { canMarkPassiveIncome } from '../src/transaction/utils/can-mark-passive-income.util';

it.each([
    [TransactionTypeEnum.INCOME, null, true],
    [TransactionTypeEnum.INCOME, YieldKindEnum.NONE, true],
    [TransactionTypeEnum.INCOME, YieldKindEnum.STAKING, false],
    [TransactionTypeEnum.EXPENSE, null, false],
    [TransactionTypeEnum.EXPENSE, YieldKindEnum.NONE, false],
    [TransactionTypeEnum.TRANSFER, null, false]
])('%s with kind %s can be marked: %s', (type, yieldKind, expected) => {
    expect(canMarkPassiveIncome(type, yieldKind)).toBe(expected);
});
