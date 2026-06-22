import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { BankAccountTypeEnum } from '../enum/bank-account-type.enum';
import { BankProviderEnum } from '../enum/bank-provider.enum';

import type { BankAccountInterface } from '../interface/bank-account.interface';

const BANK_PROVIDER_TITLE: Record<BankProviderEnum, string> = {
    [BankProviderEnum.MONOBANK]: 'Monobank',
    [BankProviderEnum.PRIVATBANK]: 'Privatbank',
    [BankProviderEnum.ERSTE]: 'Erste',
    [BankProviderEnum.REVOLUT]: 'Revolut',
    [BankProviderEnum.WISE]: 'Wise'
};

const formatMonobankTitle = (bankAccount: BankAccountInterface): string => {
    const bankName = BANK_PROVIDER_TITLE[bankAccount.provider];

    if (bankAccount.type === BankAccountTypeEnum.JAR && isNotEmptyString(bankAccount.title)) {
        return `${bankName} «${bankAccount.title}»`;
    }

    const cardType = bankAccount.type.charAt(0).toUpperCase() + bankAccount.type.slice(1).toLowerCase();

    if (isNotEmptyArray(bankAccount.maskedPan)) {
        const lastFourDigits = bankAccount.maskedPan[0].slice(-4);

        return `${bankName} ${cardType} •${lastFourDigits}`;
    }

    return `${bankName} ${cardType} ${bankAccount.currencyCode}`;
};

const formatDefaultTitle = (bankAccount: BankAccountInterface): string => {
    const bankName = BANK_PROVIDER_TITLE[bankAccount.provider];

    if (isNotEmptyArray(bankAccount.maskedPan)) {
        const lastFourDigits = bankAccount.maskedPan[0].slice(-4);

        return `${bankName} •${lastFourDigits}`;
    }

    return `${bankName} ${bankAccount.currencyCode}`;
};

export const formatBankAccountTitle = (bankAccount: BankAccountInterface): string => {
    if (bankAccount.provider === BankProviderEnum.MONOBANK) {
        return formatMonobankTitle(bankAccount);
    }

    return formatDefaultTitle(bankAccount);
};
