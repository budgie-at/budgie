import { DEFAULT_TRANSACTION_FILTER, RUNWAY_WINDOW_MONTHS, RunwayDriverDimensionEnum, StatisticsRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { STATISTICS_TABLES } from '../../transaction/constant/statistics-tables.constant';
import { aggregateRunwayDrivers } from '../utils/aggregate-runway-drivers.util';
import { computeRunway } from '../utils/compute-runway.util';
import { median } from '../utils/median.util';

import type { UseRunwayQueryParams } from '../interface/use-runway-query-params.interface';
import type { LanguageEnum } from '@budgie/contracts';

export const runwaySeriesAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, defaultInstrumentId: number) =>
        statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, defaultInstrumentId, RUNWAY_WINDOW_MONTHS)
);

export const runwayDriverSeriesAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [defaultInstrumentId, dimension, language]: readonly [number, RunwayDriverDimensionEnum, LanguageEnum]) =>
        statisticsRepository.getRunwayDriverSeriesQuery(
            DEFAULT_TRANSACTION_FILTER,
            defaultInstrumentId,
            dimension,
            RUNWAY_WINDOW_MONTHS,
            language
        )
);

export const useRunwayQuery = (params: UseRunwayQueryParams) => {
    const { dimension, liquid, isAllIn } = params;
    const language = useSetting('language');
    const { defaultInstrument } = useSettingsContext();
    const seriesResult = useLiveAtomValue(runwaySeriesAtom(defaultInstrument.id));
    const driverResult = useLiveAtomValue(runwayDriverSeriesAtom([defaultInstrument.id, dimension, language]));
    const irregularDimension = isAllIn ? RunwayDriverDimensionEnum.CATEGORY : dimension;
    const irregularDriverResult = useLiveAtomValue(runwayDriverSeriesAtom([defaultInstrument.id, irregularDimension, language]));
    const today = useToday();
    const seriesRows = AsyncResult.getOrElse(seriesResult, () => []);
    const monthlyBurn = median(seriesRows.map(row => row.expense));
    const breakdown = aggregateRunwayDrivers(
        AsyncResult.getOrElse(driverResult, () => []),
        monthlyBurn,
        isAllIn
    );
    const irregularBreakdown =
        isAllIn && dimension !== RunwayDriverDimensionEnum.CATEGORY
            ? aggregateRunwayDrivers(
                  AsyncResult.getOrElse(irregularDriverResult, () => []),
                  monthlyBurn,
                  isAllIn
              )
            : breakdown;
    const computation = computeRunway({
        series: seriesRows,
        liquid,
        irregularMonthlyAmount: isAllIn ? irregularBreakdown.irregularMonthlyAmount : 0,
        referenceDate: today
    });

    return { computation, drivers: breakdown.drivers, series: seriesRows };
};
