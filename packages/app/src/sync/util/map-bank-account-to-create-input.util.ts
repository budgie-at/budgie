import { BankAccountInterface, BankAccountTypeEnum, BankProviderEnum } from '@budgie/bank-sync';
import { AccountTypeEnum, ExternalSourceEnum, LiabilityAccountCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

/* eslint-disable lingui/no-unlocalized-strings */
const BANK_PROVIDER_TITLE: Record<BankProviderEnum, string> = {
    [BankProviderEnum.MONOBANK]: 'Monobank',
    [BankProviderEnum.PRIVATBANK]: 'Privatbank',
    [BankProviderEnum.ERSTE]: 'Erste',
    [BankProviderEnum.REVOLUT]: 'Revolut',
    [BankProviderEnum.WISE]: 'Wise'
};
/* eslint-enable lingui/no-unlocalized-strings */

const generateMonobankTitle = (bankAccount: BankAccountInterface): string => {
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

const generateDefaultBankTitle = (bankAccount: BankAccountInterface): string => {
    const bankName = BANK_PROVIDER_TITLE[bankAccount.provider];

    if (isNotEmptyArray(bankAccount.maskedPan)) {
        const lastFourDigits = bankAccount.maskedPan[0].slice(-4);

        return `${bankName} •${lastFourDigits}`;
    }

    return `${bankName} ${bankAccount.currencyCode}`;
};

export const generateBankAccountTitle = (bankAccount: BankAccountInterface): string => {
    if (bankAccount.provider === BankProviderEnum.MONOBANK) {
        return generateMonobankTitle(bankAccount);
    }

    return generateDefaultBankTitle(bankAccount);
};

export const mapBankAccountToCreateInput = (
    bankAccount: BankAccountInterface,
    instrumentId: number,
    provider: ExternalSourceEnum
): LiabilityAccountCreateInputInterface => {
    const icon = bankAccount.type === BankAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark;

    return {
        title: generateBankAccountTitle(bankAccount),
        type: AccountTypeEnum.BANK_SYNC,
        icon,
        instrumentId,
        currentBalance: 0,
        externalId: bankAccount.id,
        externalSource: provider,
        iban: bankAccount.iban
    };
};
