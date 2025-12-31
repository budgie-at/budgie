import { AccountTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const ACCOUNT_TYPE_DESCRIPTION: Record<AccountTypeEnum, MessageDescriptor> = {
    [AccountTypeEnum.BANK]: msg`Traditional bank accounts`,
    [AccountTypeEnum.CASH]: msg`Physical cash on hand`,
    [AccountTypeEnum.DEBT]: msg`Money you owe or are owed`,
    [AccountTypeEnum.CRYPTO]: msg`Cryptocurrency holdings`,
    [AccountTypeEnum.STOCKS]: msg`Stock investments`,
    [AccountTypeEnum.SAVINGS]: msg`Savings accounts`,
    [AccountTypeEnum.BANK_SYNC]: msg`Synced bank accounts`
};
