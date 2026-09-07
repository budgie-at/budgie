import { AccountDebtTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const DEBT_SETTLED_LABEL: Record<AccountDebtTypeEnum, MessageDescriptor> = {
    [AccountDebtTypeEnum.LENT]: msg`Returned`,
    [AccountDebtTypeEnum.BORROW]: msg`Repaid`
};
