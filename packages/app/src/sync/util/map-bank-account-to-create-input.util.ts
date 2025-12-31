import { BankAccountInterface } from '@budgie/bank-sync';
import { AccountTypeEnum, ExternalSourceEnum, LiabilityAccountCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

const generateAccountTitle = (bankAccount: BankAccountInterface): string => {
    const cardType = bankAccount.type.charAt(0).toUpperCase() + bankAccount.type.slice(1).toLowerCase();

    if (isNotEmptyArray(bankAccount.maskedPan)) {
        const lastFourDigits = bankAccount.maskedPan[0].slice(-4);

        // eslint-disable-next-line lingui/no-unlocalized-strings
        return `Monobank ${cardType} •${lastFourDigits}`;
    }

    // eslint-disable-next-line lingui/no-unlocalized-strings
    return `Monobank ${cardType} ${bankAccount.currencyCode}`;
};

export const mapBankAccountToCreateInput = (
    bankAccount: BankAccountInterface,
    instrumentId: number,
    provider: ExternalSourceEnum
): LiabilityAccountCreateInputInterface => ({
    title: generateAccountTitle(bankAccount),
    type: AccountTypeEnum.BANK_SYNC,
    icon: UserIconNameEnum.Landmark,
    instrumentId,
    currentBalance: 0,
    externalId: bankAccount.id,
    externalSource: provider,
    iban: bankAccount.iban
});
