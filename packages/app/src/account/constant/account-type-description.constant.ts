import { AccountTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const ACCOUNT_TYPE_DESCRIPTION: Record<AccountTypeEnum, MessageDescriptor> = {
    [AccountTypeEnum.BANK]: msg`Everyday transactions and spending`,
    [AccountTypeEnum.CASH]: msg`Emergency fund and savings goals`,
    [AccountTypeEnum.DEBT]: msg`Money lent or borrowed`,
    [AccountTypeEnum.CRYPTO]: msg`Digital currencies and tokens`,
    [AccountTypeEnum.STOCKS]: msg`Stocks and securities`,
    [AccountTypeEnum.SAVINGS]: msg`Long-term savings and investments`
};
