import { Trans } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { ActivityIndicator, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldPriceJobsFamily } from '../../constant/yield-price-jobs-family-atom.constant';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: Pick<YieldSummaryInterface, 'hasYield' | 'instrumentIds'>;
}

const STATUS_MAX_FONT_SIZE_MULTIPLIER = 1.5;
const SHOW_DELAY = 1500;
const FADE_DURATION = 200;
const INDICATOR_SIZE = 12;
const INDICATOR_SCALE = 0.6;
const ENTERING = FadeIn.delay(SHOW_DELAY).duration(FADE_DURATION);
const SLOT_STYLE = { width: INDICATOR_SIZE, height: INDICATOR_SIZE };
const INDICATOR_STYLE = { transform: [{ scale: INDICATOR_SCALE }] };

export const YieldHeroPricesStatus = ({ summary }: Props) => {
    const isUpdatingPrices = AsyncResult.getOrElse(useLiveAtomValue(yieldPriceJobsFamily(summary.instrumentIds)), () => false);

    if (!summary.hasYield || !isUpdatingPrices) {
        return null;
    }

    return (
        <Animated.View entering={ENTERING} accessibilityLiveRegion="polite" className="ml-auto shrink-0 flex-row items-center gap-x-[4px]">
            <View className="items-center justify-center" style={SLOT_STYLE}>
                <ActivityIndicator size="small" colorClassName="accent-secondary-foreground" style={INDICATOR_STYLE} />
            </View>
            <Text maxFontSizeMultiplier={STATUS_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
                <Trans>Updating</Trans>
            </Text>
        </Animated.View>
    );
};
