import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { MONOBANK_BALANCE_DIVISOR } from '../constant/monobank-balance-divisor.constant';

import { monobankCurrencyCodeMapper } from './monobank-currency-code.mapper';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { Jar } from '@liaugust/monobank-sdk';

export const monobankJarMapper = (jar: Jar): SyncAccountInterface => ({
    id: jar.id,
    provider: SyncProviderEnum.MONOBANK,
    currencyCode: monobankCurrencyCodeMapper(jar.currencyCode),
    currencyCodeNumeric: jar.currencyCode,
    balance: jar.balance / MONOBANK_BALANCE_DIVISOR,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.JAR,
    title: jar.title
});
