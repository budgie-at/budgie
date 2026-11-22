import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { YIELD_RANGE_NAME } from '../../constant/yield-range-name.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldBreakdownRows } from '../../hook/use-yield-breakdown-rows.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { YieldBreakdownRow } from '../yield-breakdown-row/yield-breakdown-row';
import { YieldBreakdownRunRate } from '../yield-breakdown-run-rate/yield-breakdown-run-rate';
import { YieldBreakdownSection } from '../yield-breakdown-section/yield-breakdown-section';
import { YieldBreakdownSkeleton } from '../yield-breakdown-skeleton/yield-breakdown-skeleton';
import { YieldOpenPositionRow } from '../yield-open-position-row/yield-open-position-row';

export const YieldBreakdown = () => {
    const { t } = useLingui();
    const summary = useYieldSummary();
    const { screenKey } = use(YieldScreenContext);
    const rows = useYieldBreakdownRows(summary);

    if (!isDefined(summary)) {
        return <YieldBreakdownSkeleton />;
    }

    const rangeName = t(YIELD_RANGE_NAME[screenKey.key.range]);
    const { runRate } = summary;
    const hasOpenRow = isDefined(screenKey.scopeId) && screenKey.from !== screenKey.scopeId;
    const hasTotalsRows = isNotEmptyArray(rows);

    if (!hasOpenRow && !hasTotalsRows && !isDefined(runRate)) {
        return null;
    }

    return (
        <View className="gap-y-[24px]">
            {hasOpenRow ? (
                <YieldBreakdownSection>
                    <YieldOpenPositionRow />
                </YieldBreakdownSection>
            ) : null}
            {hasTotalsRows ? (
                <YieldBreakdownSection title={t`Totals · ${rangeName}`}>
                    {rows.map(row => (
                        <YieldBreakdownRow
                            key={row.testID}
                            title={row.title}
                            subtitle={row.subtitle}
                            value={row.value}
                            testID={row.testID}
                            valueClassName={row.valueClassName}
                        />
                    ))}
                </YieldBreakdownSection>
            ) : null}
            {isDefined(runRate) ? (
                <YieldBreakdownSection title={t`Outlook`}>
                    <YieldBreakdownRunRate runRate={runRate} />
                </YieldBreakdownSection>
            ) : null}
        </View>
    );
};
