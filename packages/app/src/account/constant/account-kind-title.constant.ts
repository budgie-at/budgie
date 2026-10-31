import { AccountTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const ACCOUNT_KIND_TITLE: Record<AccountTypeEnum, MessageDescriptor> = {
    [AccountTypeEnum.BANK]: msg`Checking`,
    [AccountTypeEnum.CASH]: msg`Cash & savings`,
    [AccountTypeEnum.CRYPTO]: msg`Crypto`,
    [AccountTypeEnum.DEBT]: msg`Debt`,
    [AccountTypeEnum.DEPOSIT]: msg`Term deposit`,
    [AccountTypeEnum.STOCKS]: msg`Stocks`,
    [AccountTypeEnum.SAVINGS]: msg`Savings`,
    [AccountTypeEnum.BANK_SYNC]: msg`Bank sync`,
    [AccountTypeEnum.CRYPTO_SYNC]: msg`Crypto sync`
};
