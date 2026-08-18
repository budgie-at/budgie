import { BankAccountTypeEnum } from '../../core/enum/bank-account-type.enum';
import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { MONOBANK_BALANCE_DIVISOR } from '../constant/monobank-balance-divisor.constant';

import { monobankCurrencyCodeMapper } from './monobank-currency-code.mapper';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { Jar } from '@liaugust/monobank-sdk';

export const monobankJarMapper = (jar: Jar): BankAccountInterface => ({
    id: jar.id,
    provider: BankProviderEnum.MONOBANK,
    currencyCode: monobankCurrencyCodeMapper(jar.currencyCode),
    currencyCodeNumeric: jar.currencyCode,
    balance: jar.balance / MONOBANK_BALANCE_DIVISOR,
    creditLimit: 0,
    type: BankAccountTypeEnum.JAR,
    title: jar.title
});
