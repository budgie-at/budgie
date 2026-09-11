import { DEFAULT_RUNWAY_WINDOW, RunwayDriverDimensionEnum, RunwayWindowEnum } from '@budgie/contracts';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { RUNWAY_MINIMUM_MONTHS } from '../../constant/runway-minimum-months.constant';
import { useLiquidBalanceQuery } from '../../query/use-liquid-balance.query';
import { useRunwayQuery } from '../../query/use-runway.query';
import { RunwayDrivers } from '../runway-drivers/runway-drivers';
import { RunwayEmptyState } from '../runway-empty-state/runway-empty-state';
import { RunwayForecastChart } from '../runway-forecast-chart/runway-forecast-chart';
import { RunwayHero } from '../runway-hero/runway-hero';
import { RunwayHistoryChart } from '../runway-history-chart/runway-history-chart';
import { RunwayOverview } from '../runway-overview/runway-overview';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly filters: TransactionFilterInterface;
}

export const RunwayContent = ({ filters }: Props) => {
    const [window, setWindow] = useState<RunwayWindowEnum>(DEFAULT_RUNWAY_WINDOW);
    const [dimension, setDimension] = useState<RunwayDriverDimensionEnum>(RunwayDriverDimensionEnum.CATEGORY);
    const [isAllIn, setIsAllIn] = useState(false);

    const liquid = useLiquidBalanceQuery();
    const { computation, drivers, series } = useRunwayQuery({ filters, window, dimension, liquid });

    const handleToggleAllIn = () => {
        setIsAllIn(current => !current);
    };

    if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
        return <RunwayEmptyState monthsUsed={computation.monthsUsed} />;
    }

    return (
        <ScrollView contentContainerClassName="gap-y-7xl py-5xl" showsVerticalScrollIndicator={false}>
            <RunwayHero
                computation={computation}
                window={window}
                isAllIn={isAllIn}
                onChangeWindow={setWindow}
                onToggleAllIn={handleToggleAllIn}
            />
            <RunwayOverview computation={computation} />
            <RunwayForecastChart computation={computation} />
            <RunwayHistoryChart series={series} burn={computation.burn} />
            <RunwayDrivers
                drivers={drivers}
                dimension={dimension}
                onChangeDimension={setDimension}
                isAllIn={isAllIn}
                onToggleAllIn={handleToggleAllIn}
            />
            <MenuSpacer />
        </ScrollView>
    );
};
