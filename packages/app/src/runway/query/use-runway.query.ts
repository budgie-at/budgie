import { DEFAULT_TRANSACTION_FILTER, RUNWAY_WINDOW_MONTHS, RunwayDriverDimensionEnum, StatisticsRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { STATISTICS_TABLES } from '../../transaction/constant/statistics-tables.constant';
import { aggregateRunwayDrivers } from '../utils/aggregate-runway-drivers.util';
import { computeRunway } from '../utils/compute-runway.util';
import { median } from '../utils/median.util';

import type { UseRunwayQueryParams } from '../interface/use-runway-query-params.interface';
import type { LanguageEnum } from '@budgie/contracts';

const runwaySeriesAtom = databaseQueryFamily(STATISTICS_TABLES, StatisticsRepository, (statisticsRepository, defaultInstrumentId: number) =>
    statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, defaultInstrumentId, RUNWAY_WINDOW_MONTHS)
);

const runwayDriverSeriesAtom = databaseQueryFamily(
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
    const { dimension, liquid } = params;
    const language = useSetting('language');
    const { defaultInstrument } = useSettingsContext();
    const seriesResult = useLiveAtomValue(runwaySeriesAtom(defaultInstrument.id));
    const categoryDriverResult = useLiveAtomValue(
        runwayDriverSeriesAtom([defaultInstrument.id, RunwayDriverDimensionEnum.CATEGORY, language])
    );
    const tagDriverResult = useLiveAtomValue(runwayDriverSeriesAtom([defaultInstrument.id, RunwayDriverDimensionEnum.TAG, language]));
    const seriesRows = AsyncResult.getOrElse(seriesResult, () => []);
    const categoryDriverRows = AsyncResult.getOrElse(categoryDriverResult, () => []);
    const tagDriverRows = AsyncResult.getOrElse(tagDriverResult, () => []);
    const monthlyBurn = median(seriesRows.map(row => row.expense));
    const categoryBreakdown = aggregateRunwayDrivers(categoryDriverRows, monthlyBurn);
    const tagBreakdown = aggregateRunwayDrivers(tagDriverRows, monthlyBurn);
    const computation = computeRunway({
        series: seriesRows,
        liquid,
        irregularMonthlyAmount: categoryBreakdown.irregularMonthlyAmount,
        referenceDate: new Date()
    });
    const drivers = dimension === RunwayDriverDimensionEnum.CATEGORY ? categoryBreakdown.drivers : tagBreakdown.drivers;

    return { computation, drivers, series: seriesRows };
};
