import { AccountBalanceRepository } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { ACCOUNT_CONVERTED_BALANCE_TABLES } from '../constant/account-balance-tables.constant';

export const netWorthAtom = databaseQueryFamily(
    ACCOUNT_CONVERTED_BALANCE_TABLES,
    AccountBalanceRepository,
    (accountBalanceRepository, defaultInstrumentId: number) => accountBalanceRepository.getNetWorth(defaultInstrumentId)
);
