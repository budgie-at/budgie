import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldPriceJobsFamily } from '../../constant/yield-price-jobs-family-atom.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldFootnoteFocus } from '../../hook/use-yield-footnote-focus.hook';
import { useYieldInProgressText } from '../../hook/use-yield-in-progress-text.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendRetry } from '../yield-legend-retry/yield-legend-retry';

export const YieldLegendFootnote = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));

    const summary = useYieldSummary();
    const isUpdatingPrices = AsyncResult.getOrElse(useLiveAtomValue(yieldPriceJobsFamily(summary?.instrumentIds ?? [])), () => false);

    const isFailure = AsyncResult.isFailure(result);
    const footnoteRef = useYieldFootnoteFocus(isFailure);
    const inProgressText = useYieldInProgressText();

    if (!isFailure && (!isDefined(summary) || !summary.hasYield)) {
        return null;
    }

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
