import { AccountTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const ACCOUNT_TYPE: Record<AccountTypeEnum, MessageDescriptor> = {
    [AccountTypeEnum.BANK]: msg`Bank`,
    [AccountTypeEnum.CASH]: msg`Cash`,
    [AccountTypeEnum.DEBT]: msg`Debt`,
    [AccountTypeEnum.CRYPTO]: msg`Crypto`,
    [AccountTypeEnum.STOCKS]: msg`Stocks`,
    [AccountTypeEnum.SAVINGS]: msg`Savings`,
    [AccountTypeEnum.BANK_SYNC]: msg`Bank`,
};
