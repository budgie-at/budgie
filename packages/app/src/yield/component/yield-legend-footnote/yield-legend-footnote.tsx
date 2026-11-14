import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { yieldPriceJobsFamily } from '../../constant/yield-price-jobs-family-atom.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendRetry } from '../yield-legend-retry/yield-legend-retry';

export const YieldLegendFootnote = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const summary = AsyncResult.getOrElse(result, () => null);
    const isUpdatingPrices = AsyncResult.getOrElse(useLiveAtomValue(yieldPriceJobsFamily(summary?.instrumentIds ?? [])), () => false);

    const isFailure = AsyncResult.isFailure(result);

    if (!isFailure && (!isDefined(summary) || !summary.hasYield)) {
        return null;
    }

    const tax = formatAmount(summary?.tax ?? 0, symbol);
    const taxPart = isPositiveNumber(summary?.tax) ? t`Tax withheld ${tax}` : '';
    const estimatePart = summary?.earned.isEstimated === true ? t`≈ includes estimates` : '';
    const details = [taxPart, estimatePart].filter(isNotEmptyString).join(' · ');

    return (
        <View className="h-[20px] justify-center" testID={PassiveIncomeSelector.Footnote} accessibilityLiveRegion="polite">
            {isFailure ? (
                <YieldLegendRetry />
            ) : (
                <Text numberOfLines={1} className="text-xs text-secondary-foreground">
                    {isUpdatingPrices ? t`Updating prices…` : details}
                </Text>
            )}
        </View>
    );
};
