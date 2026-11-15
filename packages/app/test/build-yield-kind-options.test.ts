import { TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';

import { buildYieldKindOptions } from '../src/yield/utils/build-yield-kind-options.util';

it('offers every income kind plus the opt-out for income', () => {
    expect(buildYieldKindOptions(TransactionTypeEnum.INCOME)).toEqual([
        YieldKindEnum.STAKING,
        YieldKindEnum.EARN,
        YieldKindEnum.DISTRIBUTION,
        YieldKindEnum.DIVIDEND,
        YieldKindEnum.INTEREST,
        YieldKindEnum.NONE
    ]);
});

it('offers only tax and the opt-out for expenses', () => {
    expect(buildYieldKindOptions(TransactionTypeEnum.EXPENSE)).toEqual([YieldKindEnum.TAX, YieldKindEnum.NONE]);
});

it('offers nothing for transfers', () => {
    expect(buildYieldKindOptions(TransactionTypeEnum.TRANSFER)).toEqual([]);
});
