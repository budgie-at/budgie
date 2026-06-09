import { BankAccountInterface, BankAccountTypeEnum, SyncProviderEnum } from '@budgie/bank-sync';
import { AccountTypeEnum, ExternalSourceEnum, LiabilityAccountCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

/* eslint-disable lingui/no-unlocalized-strings */
const BANK_PROVIDER_TITLE: Record<SyncProviderEnum, string> = {
    [SyncProviderEnum.MONOBANK]: 'Monobank',
    [SyncProviderEnum.PRIVATBANK]: 'Privatbank',
    [SyncProviderEnum.ERSTE]: 'Erste',
    [SyncProviderEnum.REVOLUT]: 'Revolut',
    [SyncProviderEnum.WISE]: 'Wise',
    [SyncProviderEnum.BINANCE]: 'Binance'
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
    if (bankAccount.provider === SyncProviderEnum.MONOBANK) {
        return generateMonobankTitle(bankAccount);
    }

    if (bankAccount.provider === SyncProviderEnum.BINANCE && isNotEmptyString(bankAccount.title)) {
        return bankAccount.title;
    }

    return generateDefaultBankTitle(bankAccount);
};

export const mapBankAccountToCreateInput = (
    bankAccount: BankAccountInterface,
    instrumentId: number,
    provider: ExternalSourceEnum
): LiabilityAccountCreateInputInterface => {
    const isBinance = provider === ExternalSourceEnum.BINANCE;
    const bankIcon = bankAccount.type === BankAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark;
    const icon = isBinance ? UserIconNameEnum.Bitcoin : bankIcon;
    const type = isBinance ? AccountTypeEnum.CRYPTO_SYNC : AccountTypeEnum.BANK_SYNC;

    return {
        title: generateBankAccountTitle(bankAccount),
        type,
        icon,
        instrumentId,
        currentBalance: 0,
        externalId: bankAccount.id,
        externalSource: provider,
        iban: bankAccount.iban
    };
};
