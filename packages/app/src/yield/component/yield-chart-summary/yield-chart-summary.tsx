import { YieldRangeEnum } from '@budgie/market';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartSeeAllTime } from '../yield-chart-see-all-time/yield-chart-see-all-time';
import { YieldChartSinglePayout } from '../yield-chart-single-payout/yield-chart-single-payout';
import { YieldChartSummaryRow } from '../yield-chart-summary-row/yield-chart-summary-row';
import { YieldChartSummaryText } from '../yield-chart-summary-text/yield-chart-summary-text';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

const TITLE_MAX_FONT_SIZE_MULTIPLIER = 1.4;
const EMPTY_CLASSNAME = 'items-center gap-y-sm px-3xl py-xl';

export const YieldChartSummary = ({ summary }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);

    const count = summary.payoutCount;
    const isEmpty = count === 0;
    const isSingle = count === 1;
    const hasOlderPayouts = isDefined(summary.firstYieldDay) && summary.firstYieldDay < summary.windowStart;
    const isSeeAllTimeVisible = (isEmpty || (isSingle && hasOlderPayouts)) && screenKey.key.range !== YieldRangeEnum.ALL;
    const title = t({ id: 'passive-income.payouts.title', message: plural(count, { one: '# payout', other: '# payouts' }) });
    const filledBuckets = summary.buckets.filter(bucket => bucket.total > 0);
    const isMultiple = count > 1;
    const containerClassName = cn('gap-y-xs', isEmpty && EMPTY_CLASSNAME, isSingle && '-mb-[6px]');

    return (
        <View className={containerClassName} testID={PassiveIncomeSelector.PlotSummary}>
            {isEmpty ? (
                <YieldChartSummaryText summary={summary} />
            ) : (
                <Text
                    className="text-md font-semibold tabular-nums text-primary"
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                    testID={PassiveIncomeSelector.ChartTitle}
                >
                    {title}
                </Text>
            )}
            {isSingle ? <YieldChartSinglePayout /> : null}
            {isMultiple ? filledBuckets.map(bucket => <YieldChartSummaryRow key={bucket.start} summary={summary} bucket={bucket} />) : null}
            {isSeeAllTimeVisible ? <YieldChartSeeAllTime /> : null}
        </View>
    );
};
