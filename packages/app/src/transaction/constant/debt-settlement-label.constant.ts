import { AccountDebtTypeEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const DEBT_SETTLEMENT_LABEL: Record<AccountDebtTypeEnum, MessageDescriptor> = {
    [AccountDebtTypeEnum.LENT]: msg`Debt`,
    [AccountDebtTypeEnum.BORROW]: msg`Debt`,
    [AccountDebtTypeEnum.INSTALLMENT]: msg`Installment plan`
};
