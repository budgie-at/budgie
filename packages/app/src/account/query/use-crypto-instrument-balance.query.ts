import { accountBalanceRepository } from '../../@generic/drizzle/db/db';

import { useCachedBalanceQuery } from './use-cached-balance.query';

export const useCryptoInstrumentBalanceQuery = (instrumentId: number) =>
    useCachedBalanceQuery(accountBalanceRepository.getTotalByCryptoInstrument(instrumentId), [instrumentId]);
