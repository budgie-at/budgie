import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldPriceJobsFamily } from '../../constant/yield-price-jobs-family-atom.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { useYieldFootnoteFocus } from '../../hook/use-yield-footnote-focus.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendRetry } from '../yield-legend-retry/yield-legend-retry';

export const YieldLegendFootnote = () => {
    const { t } = useLingui();
    const { screenKey, mode } = use(YieldScreenContext);
    const { formatTick } = useYieldDateLabels();
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));

    const summary = useYieldSummary();
    const isUpdatingPrices = AsyncResult.getOrElse(useLiveAtomValue(yieldPriceJobsFamily(summary?.instrumentIds ?? [])), () => false);

    const isFailure = AsyncResult.isFailure(result);
    const footnoteRef = useYieldFootnoteFocus(isFailure);

    if (!isFailure && (!isDefined(summary) || !summary.hasYield)) {
        return null;
    }

    const inProgressBucket = summary?.buckets.find(bucket => bucket.isInProgress);
    const periodLabel = isDefined(summary) && isDefined(inProgressBucket) ? formatTick(inProgressBucket, summary.bucketUnit) : '';
    const inProgressText = mode === YieldChartModeEnum.BARS && isDefined(inProgressBucket) ? t`${periodLabel} is in progress` : '';
    const details = isUpdatingPrices ? t`Updating prices…` : inProgressText;

    return (
        <View
            ref={footnoteRef}
            accessible={!isFailure}
            className="min-h-[20px] justify-center"
            testID={PassiveIncomeSelector.Footnote}
            accessibilityLiveRegion="polite"
        >
            {isFailure ? <YieldLegendRetry /> : <Text className="text-xs text-secondary-foreground">{details}</Text>}
        </View>
    );
};
