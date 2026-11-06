import { CurrencyEnum, InstrumentDailyMarketPriceEntityTable, InstrumentEntityTable, InstrumentRepository } from '@budgie/contracts';
import { InstrumentDailyMarketPriceRepository } from '@budgie/market';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const fundLatestPriceAtom = databaseQueryFamily(
    [InstrumentDailyMarketPriceEntityTable, InstrumentEntityTable],
    InstrumentDailyMarketPriceRepository,
    (instrumentDailyMarketPriceRepository, instrumentId: number) =>
        Effect.flatMap(InstrumentRepository, instrumentRepository =>
            Effect.flatMap(instrumentRepository.findByCode(CurrencyEnum.UAH), hryvnia =>
                isDefined(hryvnia) ? instrumentDailyMarketPriceRepository.findLatest(instrumentId, hryvnia.id) : Effect.succeed(null)
            )
        )
);

export const useInzhurFundLatestPriceQuery = (instrumentId: number) =>
    AsyncResult.getOrElse(useLiveAtomValue(fundLatestPriceAtom(instrumentId)), () => null);
