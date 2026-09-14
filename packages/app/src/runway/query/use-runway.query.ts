import { DEFAULT_TRANSACTION_FILTER, RUNWAY_WINDOW_MONTHS, RunwayDriverDimensionEnum } from '@budgie/contracts';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { aggregateRunwayDrivers } from '../utils/aggregate-runway-drivers.util';
import { computeRunway } from '../utils/compute-runway.util';
import { median } from '../utils/median.util';

import type { UseRunwayQueryParams } from '../interface/use-runway-query-params.interface';

export const useRunwayQuery = (params: UseRunwayQueryParams) => {
    const { dimension, liquid } = params;
    const language = useSetting('language');
    const { defaultInstrument } = useSettingsContext();
    const { data: seriesRows } = useDatabaseLiveQuery(
        statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, defaultInstrument.id, RUNWAY_WINDOW_MONTHS),
        [defaultInstrument.id]
    );
    const { data: categoryDriverRows } = useDatabaseLiveQuery(
        statisticsRepository.getRunwayDriverSeriesQuery(
            DEFAULT_TRANSACTION_FILTER,
            defaultInstrument.id,
            RunwayDriverDimensionEnum.CATEGORY,
            RUNWAY_WINDOW_MONTHS,
            language
        ),
        [defaultInstrument.id, language]
    );
    const { data: tagDriverRows } = useDatabaseLiveQuery(
        statisticsRepository.getRunwayDriverSeriesQuery(
            DEFAULT_TRANSACTION_FILTER,
            defaultInstrument.id,
            RunwayDriverDimensionEnum.TAG,
            RUNWAY_WINDOW_MONTHS,
            language
        ),
        [defaultInstrument.id, language]
    );
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
