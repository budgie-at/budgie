import { RunwayDriverDimensionEnum } from '@budgie/contracts';
import { useState } from 'react';
import { View } from 'react-native';

import { ScreenChromeScrollView } from '@rnw-community/react-native-screen-chrome';

import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
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

export const RunwayContent = () => {
    const [dimension, setDimension] = useState<RunwayDriverDimensionEnum>(RunwayDriverDimensionEnum.CATEGORY);
    const [isAllIn, setIsAllIn] = useState(false);

    const liquid = useLiquidBalanceQuery();
    const { computation, drivers, series } = useRunwayQuery({ dimension, liquid, isAllIn });

    const handleToggleAllIn = () => {
        setIsAllIn(current => !current);
    };

    if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
        return <RunwayEmptyState monthsUsed={computation.monthsUsed} />;
    }

    return (
        <ScreenChromeScrollView contentInsetTop={SCREEN_CHROME_CONTENT_INSET_TOP} showsVerticalScrollIndicator={false}>
            <View className="gap-y-7xl pb-5xl">
                <View className="gap-y-lg">
                    <RunwayVerdict computation={computation} />
                    <RunwayAllInToggle isAllIn={isAllIn} onToggle={handleToggleAllIn} />
                </View>

                <RunwayFlowRow computation={computation} />
                <RunwayForecastChart computation={computation} />
                <RunwayHistoryChart series={series} burn={computation.burn} />
                <RunwayDrivers drivers={drivers} dimension={dimension} onChangeDimension={setDimension} />
                <MenuSpacer />
            </View>
        </ScreenChromeScrollView>
    );
};
