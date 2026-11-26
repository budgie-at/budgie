import { ExchangeRateEntityTable } from '@budgie/contracts';
import { ExchangeRateRepository } from '@budgie/market';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const noExchangeRateAtom = Atom.make(AsyncResult.success(null));

export const rateByBaseAndQuoteIdsAtom = databaseQueryFamily(
    [ExchangeRateEntityTable],
    ExchangeRateRepository,
    (exchangeRateRepository, [baseInstrumentId, quoteInstrumentId]: readonly [number, number]) =>
        exchangeRateRepository.findByBaseAndQuoteIds(baseInstrumentId, quoteInstrumentId)
);

export const useGetRatesByBaseAndQuoteIdsQuery = (baseInstrumentId: number, quoteInstrumentId: number) => {
    const shouldQuery = isPositiveNumber(baseInstrumentId) && isPositiveNumber(quoteInstrumentId) && baseInstrumentId !== quoteInstrumentId;
    const result = useLiveAtomValue(shouldQuery ? rateByBaseAndQuoteIdsAtom([baseInstrumentId, quoteInstrumentId]) : noExchangeRateAtom);

    return { rate: AsyncResult.getOrElse(result, () => null) ?? null, loading: AsyncResult.isInitial(result) };
};
