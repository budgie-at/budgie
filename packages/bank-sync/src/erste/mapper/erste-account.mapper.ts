import { BankAccountTypeEnum } from '../../core/enum/bank-account-type.enum';
import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { ERSTE_CURRENCY_CODE_EUR } from '../constant/erste.constant';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { ErsteAccountInfoInterface } from '../interface/erste-account-info.interface';

export const ersteAccountMapper = (account: ErsteAccountInfoInterface): BankAccountInterface => ({
    id: account.iban,
    provider: BankProviderEnum.ERSTE,
    currencyCode: account.currency,
    currencyCodeNumeric: ERSTE_CURRENCY_CODE_EUR,
    balance: account.newBalance,
    creditLimit: 0,
    type: BankAccountTypeEnum.CHECKING,
    iban: account.iban
});
