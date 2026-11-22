import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YIELD_FOOTNOTE_HEIGHT } from '../../constant/yield-footnote-height.constant';
import { useYieldFootnoteFocus } from '../../hook/use-yield-footnote-focus.hook';
import { useYieldFootnoteState } from '../../hook/use-yield-footnote-state.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldLegendInProgressSwatch } from '../yield-legend-in-progress-swatch/yield-legend-in-progress-swatch';
import { YieldLegendRetry } from '../yield-legend-retry/yield-legend-retry';

const ESTIMATED_KEY = 'ESTIMATED';
const FOOTNOTE_STYLE = { minHeight: YIELD_FOOTNOTE_HEIGHT };

export const YieldLegendFootnote = () => {
    const { isFailure, isEstimated, details } = useYieldFootnoteState();
    const footnoteRef = useYieldFootnoteFocus(isFailure);

    if (!isFailure && !isDefined(details) && !isEstimated) {
        return null;
    }

    return (
        <View className="gap-y-xs">
            {isFailure || isDefined(details) ? (
                <View
                    ref={footnoteRef}
                    accessible={!isFailure}
                    className="shrink flex-row items-center gap-x-[8px]"
                    style={FOOTNOTE_STYLE}
                    testID={PassiveIncomeSelector.Footnote}
                    accessibilityLiveRegion="polite"
                >
                    {isFailure ? <YieldLegendRetry /> : null}
                    {isFailure ? null : <YieldLegendInProgressSwatch />}
                    {isFailure ? null : <Text className="text-sm text-secondary-foreground">{details}</Text>}
                </View>
            ) : null}
            {isEstimated ? (
                <View accessible className="pl-[20px]" testID={PassiveIncomeSelector.LegendRow(ESTIMATED_KEY)}>
                    <Text className="text-sm text-secondary-foreground">
                        <Trans>≈ Includes estimated prices</Trans>
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
