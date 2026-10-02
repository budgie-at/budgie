import { AccountBalanceRepository } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { ACCOUNT_BALANCE_TABLES } from '../constant/account-balance-tables.constant';

import { useCachedBalanceQuery } from './use-cached-balance.query';

const cryptoInstrumentBalanceAtom = databaseQueryFamily(
    ACCOUNT_BALANCE_TABLES,
    AccountBalanceRepository,
    (accountBalanceRepository, instrumentId: number) => accountBalanceRepository.getTotalByCryptoInstrument(instrumentId)
);

export const useCryptoInstrumentBalanceQuery = (instrumentId: number) => useCachedBalanceQuery(cryptoInstrumentBalanceAtom(instrumentId));
