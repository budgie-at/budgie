import { RunwayDriverDimensionEnum } from '@budgie/contracts';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { RUNWAY_MINIMUM_MONTHS } from '../../constant/runway-minimum-months.constant';
import { useLiquidBalanceQuery } from '../../query/use-liquid-balance.query';
import { useRunwayQuery } from '../../query/use-runway.query';
import { RunwayAllInToggle } from '../runway-all-in-toggle/runway-all-in-toggle';
import { RunwayDrivers } from '../runway-drivers/runway-drivers';
import { RunwayEmptyState } from '../runway-empty-state/runway-empty-state';
import { RunwayFlowRow } from '../runway-flow-row/runway-flow-row';
import { RunwayForecastChart } from '../runway-forecast-chart/runway-forecast-chart';
import { RunwayHistoryChart } from '../runway-history-chart/runway-history-chart';
import { RunwayVerdict } from '../runway-verdict/runway-verdict';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
}

export const RunwayContent = ({ filters }: Props) => {
    const [dimension, setDimension] = useState<RunwayDriverDimensionEnum>(RunwayDriverDimensionEnum.CATEGORY);
    const [isAllIn, setIsAllIn] = useState(false);

    const liquid = useLiquidBalanceQuery();
    const { computation, drivers, series } = useRunwayQuery({ filters, dimension, liquid });

    const handleToggleAllIn = () => {
        setIsAllIn(current => !current);
    };

    if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
        return <RunwayEmptyState monthsUsed={computation.monthsUsed} />;
    }

    const forecastComputation = isAllIn
        ? {
              ...computation,
              burn: computation.allInBurn,
              net: computation.allInNet,
              runwayMonths: computation.allInRunwayMonths,
              runsOutAt: computation.allInRunsOutAt,
              isPositive: computation.allInNet >= 0
          }
        : computation;

    return (
        <ScrollView contentContainerClassName="gap-y-7xl py-5xl" showsVerticalScrollIndicator={false}>
            <View className="gap-y-lg">
                <RunwayVerdict computation={forecastComputation} />
                <RunwayAllInToggle isAllIn={isAllIn} onToggle={handleToggleAllIn} />
            </View>

            <RunwayFlowRow computation={forecastComputation} />
            <RunwayForecastChart computation={forecastComputation} />
            <RunwayHistoryChart series={series} burn={computation.burn} />
            <RunwayDrivers drivers={drivers} dimension={dimension} onChangeDimension={setDimension} />
            <MenuSpacer />
        </ScrollView>
    );
};
