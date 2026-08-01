import { SyncAccountBalanceStateEnum } from '../../core/enum/sync-account-balance-state.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { MONOBANK_BALANCE_DIVISOR } from '../constant/monobank-balance-divisor.constant';

import { monobankAccountTypeMapper } from './monobank-account-type.mapper';
import { monobankCashbackTypeMapper } from './monobank-cashback-type.mapper';
import { monobankCurrencyCodeMapper } from './monobank-currency-code.mapper';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { MonobankAccountApiInterface } from '../interface/monobank-account-api.interface';

export const monobankAccountMapper = (account: MonobankAccountApiInterface): SyncAccountInterface => ({
    id: account.id,
    provider: SyncProviderEnum.MONOBANK,
    currencyCode: monobankCurrencyCodeMapper(account.currencyCode),
    currencyCodeNumeric: account.currencyCode,
    balance: account.balance / MONOBANK_BALANCE_DIVISOR,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: account.creditLimit / MONOBANK_BALANCE_DIVISOR,
    type: monobankAccountTypeMapper(account.type),
    iban: account.iban,
    maskedPan: account.maskedPan,
    cashbackType: monobankCashbackTypeMapper(account.cashbackType)
});
