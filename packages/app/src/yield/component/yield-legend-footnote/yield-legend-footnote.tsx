import { Text, View } from 'react-native';

import { YIELD_FOOTNOTE_HEIGHT } from '../../constant/yield-footnote-height.constant';
import { useYieldFootnoteFocus } from '../../hook/use-yield-footnote-focus.hook';
import { useYieldFootnoteState } from '../../hook/use-yield-footnote-state.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendEstimatedRow } from '../yield-legend-estimated-row/yield-legend-estimated-row';
import { YieldLegendInProgressSwatch } from '../yield-legend-in-progress-swatch/yield-legend-in-progress-swatch';
import { YieldLegendRetry } from '../yield-legend-retry/yield-legend-retry';

const FOOTNOTE_STYLE = { minHeight: YIELD_FOOTNOTE_HEIGHT };

export const YieldLegendFootnote = () => {
    const { isFailure, isEstimated, hasDetails, hasSwatch, details } = useYieldFootnoteState();
    const footnoteRef = useYieldFootnoteFocus(isFailure);

    if (!isFailure && !hasDetails && !isEstimated) {
        return null;
    }

    return (
        <View className="flex-row flex-wrap items-center gap-x-md gap-y-xs">
            {isFailure || hasDetails ? (
                <View
                    ref={footnoteRef}
                    accessible={!isFailure}
                    className="shrink flex-row items-center gap-x-xs"
                    style={FOOTNOTE_STYLE}
                    testID={PassiveIncomeSelector.Footnote}
                    accessibilityLiveRegion="polite"
                >
                    {isFailure ? <YieldLegendRetry /> : null}
                    {hasSwatch && !isFailure ? <YieldLegendInProgressSwatch /> : null}
                    {isFailure ? null : <Text className="text-xs text-secondary-foreground">{details}</Text>}
                </View>
            ) : null}
            {isEstimated ? <YieldLegendEstimatedRow /> : null}
        </View>
    );
};
