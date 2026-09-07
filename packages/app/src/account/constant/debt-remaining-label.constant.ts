import { AccountDebtTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const DEBT_REMAINING_LABEL: Record<AccountDebtTypeEnum, MessageDescriptor> = {
    [AccountDebtTypeEnum.LENT]: msg`To receive`,
    [AccountDebtTypeEnum.BORROW]: msg`To repay`
};
