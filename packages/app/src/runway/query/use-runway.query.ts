import {
    CategoryEntityTable,
    DEFAULT_TRANSACTION_FILTER,
    DefaultCategoryTranslationEntityTable,
    RUNWAY_WINDOW_MONTHS,
    RunwayDriverDimensionEnum,
    StatisticsRepository,
    TagEntityTable
} from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { STATISTICS_TABLES } from '../../transaction/constant/statistics-tables.constant';
import { aggregateRunwayDrivers } from '../utils/aggregate-runway-drivers.util';
import { computeRunway } from '../utils/compute-runway.util';
import { fillRunwaySeriesMonths } from '../utils/fill-runway-series-months.util';

import type { UseRunwayQueryParams } from '../interface/use-runway-query-params.interface';
import type { LanguageEnum } from '@budgie/contracts';

export const runwaySeriesAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [defaultInstrumentId, isCryptoIncluded]: readonly [number, boolean]) =>
        statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, defaultInstrumentId, RUNWAY_WINDOW_MONTHS, isCryptoIncluded)
);

export const runwayDriverSeriesAtom = databaseQueryFamily(
    [...STATISTICS_TABLES, CategoryEntityTable, DefaultCategoryTranslationEntityTable, TagEntityTable],
    StatisticsRepository,
    (
        statisticsRepository,
        [defaultInstrumentId, dimension, language, isCryptoIncluded]: readonly [number, RunwayDriverDimensionEnum, LanguageEnum, boolean]
    ) =>
        statisticsRepository.getRunwayDriverSeriesQuery(
            DEFAULT_TRANSACTION_FILTER,
            defaultInstrumentId,
            dimension,
            RUNWAY_WINDOW_MONTHS,
            language,
            isCryptoIncluded
        )
);

export const useRunwayQuery = (params: UseRunwayQueryParams) => {
    const { dimension, liquid, isAllIn } = params;
    const language = useSetting('language');
    const isCryptoIncluded = useSetting('isRunwayCryptoIncluded');
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const seriesResult = useLiveAtomValue(runwaySeriesAtom([defaultInstrumentId, isCryptoIncluded]));
    const driverResult = useLiveAtomValue(runwayDriverSeriesAtom([defaultInstrumentId, dimension, language, isCryptoIncluded]));
    const categoryDriverResult = useLiveAtomValue(
        runwayDriverSeriesAtom([defaultInstrumentId, RunwayDriverDimensionEnum.CATEGORY, language, isCryptoIncluded])
    );
    const today = useToday();
    const seriesRows = fillRunwaySeriesMonths(
        AsyncResult.getOrElse(seriesResult, () => []),
        today
    );
    const breakdown = aggregateRunwayDrivers(
        AsyncResult.getOrElse(driverResult, () => []),
        seriesRows,
        isAllIn
    );
    const categoryBreakdown =
        dimension === RunwayDriverDimensionEnum.CATEGORY
            ? breakdown
            : aggregateRunwayDrivers(
                  AsyncResult.getOrElse(categoryDriverResult, () => []),
                  seriesRows,
                  isAllIn
              );
    const computation = computeRunway({
        series: seriesRows,
        liquid,
        irregularMonthlyAmounts: isAllIn ? [] : categoryBreakdown.irregularMonthlyAmounts,
        referenceDate: today
    });

    return { computation, drivers: breakdown.drivers, series: seriesRows };
};
