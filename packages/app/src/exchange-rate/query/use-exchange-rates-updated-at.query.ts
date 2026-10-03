import { ExchangeRateEntityTable } from '@budgie/contracts';
import { ExchangeRateRepository } from '@budgie/market';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const exchangeRatesUpdatedAtAtom = databaseQueryAtom(
    [ExchangeRateEntityTable],
    Effect.flatMap(ExchangeRateRepository, exchangeRateRepository => exchangeRateRepository.getLatestUpdatedAt())
);

export const useExchangeRatesUpdatedAtQuery = () =>
    AsyncResult.getOrElse(useLiveAtomValue(exchangeRatesUpdatedAtAtom), () => []).at(0)?.updatedAt;
