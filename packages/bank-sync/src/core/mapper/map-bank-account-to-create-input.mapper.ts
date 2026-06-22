import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { BankAccountTypeEnum } from '../enum/bank-account-type.enum';
import { formatBankAccountTitle } from '../util/format-bank-account-title.util';

import { mapBankProviderToExternalSource } from './map-bank-provider-to-external-source.mapper';

import type { BankAccountInterface } from '../interface/bank-account.interface';
import type { LiabilityAccountCreateInputInterface } from '@budgie/contracts';

export const mapBankAccountToCreateInput = (
    bankAccount: BankAccountInterface,
    instrumentId: number
): LiabilityAccountCreateInputInterface => {
    const icon = bankAccount.type === BankAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark;

    return {
        title: formatBankAccountTitle(bankAccount),
        type: AccountTypeEnum.BANK_SYNC,
        icon,
        instrumentId,
        currentBalance: 0,
        externalId: bankAccount.id,
        externalSource: mapBankProviderToExternalSource(bankAccount.provider),
        iban: bankAccount.iban
    };
};
