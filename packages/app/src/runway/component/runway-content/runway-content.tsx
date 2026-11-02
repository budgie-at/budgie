import { CRYPTO_ACCOUNT_TYPES, LIQUID_ACCOUNT_TYPES, RunwayDriverDimensionEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { AnalyticsHistoryBoundary } from '../../../sync/component/analytics-history-boundary/analytics-history-boundary';
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
    const { t } = useLingui();
    const isCryptoIncluded = useSetting('isRunwayCryptoIncluded');
    const activeAccountTypes = isCryptoIncluded ? [...LIQUID_ACCOUNT_TYPES, ...CRYPTO_ACCOUNT_TYPES] : LIQUID_ACCOUNT_TYPES;
    const [dimension, setDimension] = useState<RunwayDriverDimensionEnum>(RunwayDriverDimensionEnum.CATEGORY);
    const [isAllIn, setIsAllIn] = useState(true);

    const liquid = useLiquidBalanceQuery();
    const { computation, drivers, series } = useRunwayQuery({ dimension, liquid, isAllIn });

    const handleToggleAllIn = () => {
        setIsAllIn(current => !current);
    };

    const hasEnoughHistory = computation.monthsUsed >= RUNWAY_MINIMUM_MONTHS;

    return (
        <AnalyticsHistoryBoundary
            activeAccountTypes={activeAccountTypes}
            description={t`We’re still importing transaction history for your Runway accounts. Your forecast will appear when their history is ready.`}
        >
            {hasEnoughHistory ? (
                <View className="gap-y-3xl">
                    <View className="gap-y-lg">
                        <RunwayVerdict computation={computation} />
                        <EntranceReveal step={1}>
                            <RunwayAllInToggle isAllIn={isAllIn} onToggle={handleToggleAllIn} />
                        </EntranceReveal>
                    </View>
                    <EntranceReveal step={2}>
                        <RunwayFlowRow computation={computation} />
                    </EntranceReveal>
                    <EntranceReveal step={3}>
                        <RunwayForecastChart computation={computation} />
                    </EntranceReveal>
                    <EntranceReveal step={4}>
                        <RunwayHistoryChart series={series} burn={computation.burn} />
                    </EntranceReveal>
                    <EntranceReveal step={5}>
                        <RunwayDrivers drivers={drivers} dimension={dimension} onChangeDimension={setDimension} />
                    </EntranceReveal>
                </View>
            ) : (
                <RunwayEmptyState monthsUsed={computation.monthsUsed} />
            )}
        </AnalyticsHistoryBoundary>
    );
};
