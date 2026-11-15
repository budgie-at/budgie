import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { MOTION_FAST_DURATION } from '../../../@generic/constant/motion.constant';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldHeroSentence } from '../../hook/use-yield-hero-sentence.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { buildYieldRunningTotal } from '../../utils/build-yield-running-total.util';
import { YieldHeroCaption } from '../yield-hero-caption/yield-hero-caption';
import { YieldHeroInfoButton } from '../yield-hero-info-button/yield-hero-info-button';
import { YieldHeroLine } from '../yield-hero-line/yield-hero-line';

export const YieldHero = () => {
    const { screenKey, mode, rangeCaption } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const sentence = useYieldHeroSentence(summary, rangeCaption);
    const bucket = isDefined(selectedIndex) ? (summary?.buckets.at(selectedIndex) ?? null) : null;
    const runningTotal =
        buildYieldRunningTotal(summary?.buckets.slice(0, (selectedIndex ?? -1) + 1).map(item => item.total) ?? []).at(-1) ?? 0;
    const scrubAmount = mode === YieldChartModeEnum.RUNNING_TOTAL ? runningTotal : (bucket?.total ?? 0);
    const amount = isDefined(bucket) ? scrubAmount : (summary?.earned.value ?? 0);
    const figureKey = isDefined(bucket) ? 'scrub' : 'total';
    const isApproximate = isDefined(bucket) ? bucket.isEstimated : (summary?.earned.isEstimated ?? false);

    return (
        <View className="gap-y-xs" accessible accessibilityLabel={sentence} testID={PassiveIncomeSelector.Hero}>
            <View className="min-h-[18px] flex-row items-center justify-between gap-x-xs">
                <View className="flex-1">{isDefined(summary) ? <YieldHeroCaption summary={summary} bucket={bucket} /> : null}</View>
                <YieldHeroInfoButton />
            </View>

            <LoadingContent isLoading={!isDefined(summary)}>
                <Animated.View key={figureKey} entering={FadeIn.duration(MOTION_FAST_DURATION)}>
                    <HeroFigure
                        amount={amount}
                        currencySymbol={symbol}
                        variant="default"
                        approximate={isApproximate}
                        testID={PassiveIncomeSelector.Earned}
                    />
                </Animated.View>
            </LoadingContent>

            {isDefined(summary) ? <YieldHeroLine summary={summary} bucket={bucket} /> : <View className="min-h-[22px]" />}
        </View>
    );
};
