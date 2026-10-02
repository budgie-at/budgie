import { ExchangeRateEntityTable, ExchangeRateRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const rateByBaseAndQuoteIdsAtom = databaseQueryFamily(
    [ExchangeRateEntityTable],
    ExchangeRateRepository,
    (exchangeRateRepository, [baseInstrumentId, quoteInstrumentId]: readonly [number, number]) =>
        exchangeRateRepository.findByBaseAndQuoteIds(baseInstrumentId, quoteInstrumentId)
);

export const useGetRatesByBaseAndQuoteIdsQuery = (baseInstrumentId: number, quoteInstrumentId: number) => {
    const result = useLiveAtomValue(rateByBaseAndQuoteIdsAtom([baseInstrumentId, quoteInstrumentId]));

    return { rate: AsyncResult.getOrElse(result, () => null) ?? null, loading: AsyncResult.isInitial(result) };
};
