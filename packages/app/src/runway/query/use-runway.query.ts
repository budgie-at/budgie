import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseLiveQuery } from '../../@generic/hook/use-database-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { buildTransactionFilterKey } from '../../transaction/utils/build-transaction-filter-key.util';
import { aggregateRunwayDrivers } from '../utils/aggregate-runway-drivers.util';
import { computeRunway } from '../utils/compute-runway.util';

import type { UseRunwayQueryParams } from '../interface/use-runway-query-params.interface';
import type { TransactionFilterInterface } from '@budgie/contracts';

export const useRunwayQuery = (params: UseRunwayQueryParams) => {
    const { filters, window, dimension, liquid } = params;
    const language = useSetting('language');
    const { defaultInstrument } = useSettingsContext();
    const queryFilters: TransactionFilterInterface = { ...filters, date: null };
    const filterKey = buildTransactionFilterKey(queryFilters);
    const { data: seriesRows } = useDatabaseLiveQuery(
        statisticsRepository.getRunwaySeriesQuery(queryFilters, defaultInstrument.id, window),
        [filterKey, defaultInstrument.id, window]
    );
    const { data: driverRows } = useDatabaseLiveQuery(
        statisticsRepository.getRunwayDriverSeriesQuery(queryFilters, defaultInstrument.id, dimension, window, language),
        [filterKey, defaultInstrument.id, dimension, window, language]
    );
    const drivers = aggregateRunwayDrivers(driverRows, window);
    const irregularMonthlyAmount = drivers.filter(driver => driver.isIrregular).reduce((total, driver) => total + driver.monthlyAmount, 0);
    const computation = computeRunway({ series: seriesRows, liquid, irregularMonthlyAmount, referenceDate: new Date() });

    return { computation, drivers, series: seriesRows };
};
