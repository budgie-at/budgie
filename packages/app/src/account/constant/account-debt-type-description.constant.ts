import { AccountDebtTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const ACCOUNT_DEBT_TYPE_DESCRIPTION: Record<AccountDebtTypeEnum, MessageDescriptor> = {
    [AccountDebtTypeEnum.LENT]: msg`You gave money`,
    [AccountDebtTypeEnum.BORROW]: msg`You received money`
};
