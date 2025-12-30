import { AccountTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const ACCOUNT_TYPE_DESCRIPTION: Record<AccountTypeEnum, MessageDescriptor> = {
    [AccountTypeEnum.BANK]: msg`Everyday transactions and spending`,
    [AccountTypeEnum.CASH]: msg`Physical currency and petty cash`,
    [AccountTypeEnum.DEBT]: msg`Money lent or borrowed`,
    [AccountTypeEnum.CRYPTO]: msg`Digital currencies and crypto assets`,
    [AccountTypeEnum.STOCKS]: msg`Stocks, bonds and securities`,
    [AccountTypeEnum.SAVINGS]: msg`Emergency fund and savings goals`,
    [AccountTypeEnum.BANK_SYNC]: msg`Synced bank account`
};
