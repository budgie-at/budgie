import { isDefined } from '@rnw-community/shared';

import { exchangeRateRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';

export const useGetRatesByBaseAndQuoteIdsQuery = (baseInstrumentId: number, quoteInstrumentId: number) => {
    const {
        data: rate,
        updatedAt,
        error
    } = useLiveQuery(exchangeRateRepository.findByBaseAndQuoteIds(baseInstrumentId, quoteInstrumentId), [
        baseInstrumentId,
        quoteInstrumentId
    ]);

    return isDefined(updatedAt) ? { rate, updatedAt, error, loading: false } : { rate: null, updatedAt: null, error, loading: true };
};
