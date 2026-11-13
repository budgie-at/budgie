import { AccountBalanceRepository, InstrumentEntityTable } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { ACCOUNT_BALANCE_TABLES } from '../constant/account-balance-tables.constant';

import { useCachedBalanceQuery } from './use-cached-balance.query';

export const unitInstrumentBalanceAtom = databaseQueryFamily(
    [...ACCOUNT_BALANCE_TABLES, InstrumentEntityTable],
    AccountBalanceRepository,
    (accountBalanceRepository, instrumentId: number) => accountBalanceRepository.getTotalByUnitInstrument(instrumentId)
);

export const useUnitInstrumentBalanceQuery = (instrumentId: number) => useCachedBalanceQuery(unitInstrumentBalanceAtom(instrumentId));
