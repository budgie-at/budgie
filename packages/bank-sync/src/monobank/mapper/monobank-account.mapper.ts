import { BankProviderEnum } from '../../core/enum/bank-provider.enum';

import { monobankAccountTypeMapper } from './monobank-account-type.mapper';
import { monobankCashbackTypeMapper } from './monobank-cashback-type.mapper';
import { monobankCurrencyCodeMapper } from './monobank-currency-code.mapper';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { MonobankAccountApiInterface } from '../interface/monobank-account-api.interface';

export const monobankAccountMapper = (account: MonobankAccountApiInterface): BankAccountInterface => ({
    id: account.id,
    provider: BankProviderEnum.MONOBANK,
    currencyCode: monobankCurrencyCodeMapper(account.currencyCode),
    currencyCodeNumeric: account.currencyCode,
    balance: account.balance,
    creditLimit: account.creditLimit,
    type: monobankAccountTypeMapper(account.type),
    iban: account.iban,
    maskedPan: account.maskedPan,
    cashbackType: monobankCashbackTypeMapper(account.cashbackType)
});

