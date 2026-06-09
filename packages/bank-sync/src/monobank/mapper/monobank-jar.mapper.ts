import { BankAccountTypeEnum } from '../../core/enum/bank-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { MONOBANK_BALANCE_DIVISOR } from '../constant/monobank-balance-divisor.constant';

import { monobankCurrencyCodeMapper } from './monobank-currency-code.mapper';

import type { BankAccountInterface } from '../../core/interface/bank-account.interface';
import type { MonobankJarApiInterface } from '../interface/monobank-jar-api.interface';

export const monobankJarMapper = (jar: MonobankJarApiInterface): BankAccountInterface => ({
    id: jar.id,
    provider: SyncProviderEnum.MONOBANK,
    currencyCode: monobankCurrencyCodeMapper(jar.currencyCode),
    currencyCodeNumeric: jar.currencyCode,
    balance: jar.balance / MONOBANK_BALANCE_DIVISOR,
    creditLimit: 0,
    type: BankAccountTypeEnum.JAR,
    title: jar.title
});
