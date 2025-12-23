import { AccountDebtTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const ACCOUNT_DEBT_TYPE: Record<AccountDebtTypeEnum, MessageDescriptor> = {
    [AccountDebtTypeEnum.LENT]: msg`Lent`,
    [AccountDebtTypeEnum.BORROW]: msg`Borrowed`
};
