import { use } from 'react';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { YieldBreakdownCryptoToday } from '../yield-breakdown-crypto-today/yield-breakdown-crypto-today';
import { YieldBreakdownNet } from '../yield-breakdown-net/yield-breakdown-net';
import { YieldBreakdownRunRate } from '../yield-breakdown-run-rate/yield-breakdown-run-rate';
import { YieldBreakdownVsRate } from '../yield-breakdown-vs-rate/yield-breakdown-vs-rate';
import { YieldOpenPositionRow } from '../yield-open-position-row/yield-open-position-row';

export const YieldBreakdown = () => {
    const summary = useYieldSummary();
    const { screenKey } = use(YieldScreenContext);

    if (!isDefined(summary)) {
        return null;
    }

    const { runRate, cryptoRewardsToday, vsRate } = summary;
    const hasOpenRow = isDefined(screenKey.scopeId) && screenKey.from !== screenKey.scopeId;
    const hasSummaryRows = isPositiveNumber(summary.tax) || isDefined(runRate) || isDefined(cryptoRewardsToday) || isDefined(vsRate);

    if (!hasOpenRow && !hasSummaryRows) {
        return null;
    }

    return (
        <View className="gap-y-[12px]">
            {hasOpenRow ? (
                <GroupedListSection>
                    <YieldOpenPositionRow />
                </GroupedListSection>
            ) : null}
            {hasSummaryRows ? (
                <GroupedListSection>
                    {isPositiveNumber(summary.tax) ? <YieldBreakdownNet net={summary.net} /> : null}
                    {isDefined(runRate) ? <YieldBreakdownRunRate runRate={runRate} /> : null}
                    {isDefined(cryptoRewardsToday) ? <YieldBreakdownCryptoToday rewards={cryptoRewardsToday} /> : null}
                    {isDefined(vsRate) ? <YieldBreakdownVsRate vsRate={vsRate} /> : null}
                </GroupedListSection>
            ) : null}
        </View>
    );
};
