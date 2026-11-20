import { useAtomValue } from '@effect/atom-react/Hooks';
import { use } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { MOTION_FAST_DURATION } from '../../../@generic/constant/motion.constant';
import { HeroFigureLockContext } from '../../../@generic/context/hero-figure-lock.context';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldHeroSentence } from '../../hook/use-yield-hero-sentence.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { selectYieldScrubbedBuckets } from '../../utils/select-yield-scrubbed-buckets.util';
import { YieldHeroCaption } from '../yield-hero-caption/yield-hero-caption';
import { YieldHeroInfoButton } from '../yield-hero-info-button/yield-hero-info-button';
import { YieldHeroLine } from '../yield-hero-line/yield-hero-line';
import { YieldHeroSkeleton } from '../yield-hero-skeleton/yield-hero-skeleton';

export const YieldHero = () => {
    const { mode, rangeCaption } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const summary = useYieldSummary();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const bucket = isDefined(selectedIndex) ? (summary?.buckets.at(selectedIndex) ?? null) : null;
    const scrubAmount = selectYieldScrubbedBuckets(summary?.buckets ?? [], selectedIndex, mode).reduce((sum, item) => sum + item.total, 0);
    const amount = isDefined(bucket) ? scrubAmount : (summary?.earned.value ?? 0);
    const figureKey = isDefined(bucket) ? 'scrub' : 'total';
    const isApproximate = isDefined(bucket) ? bucket.isEstimated : (summary?.earned.isEstimated ?? false);
    const sentence = useYieldHeroSentence(summary, rangeCaption, bucket, scrubAmount);
    const figureLock = isDefined(summary) ? { amount: summary.earned.value, approximate: summary.earned.isEstimated } : null;

    if (!isDefined(summary)) {
        return <YieldHeroSkeleton />;
    }

    return (
        <View className="gap-y-xs" accessible accessibilityLabel={sentence} testID={PassiveIncomeSelector.Hero}>
            <YieldHeroCaption summary={summary} bucket={bucket}>
                <YieldHeroInfoButton />
            </YieldHeroCaption>

            <HeroFigureLockContext value={figureLock}>
                <Animated.View key={figureKey} entering={FadeIn.duration(MOTION_FAST_DURATION)} className="px-xs">
                    <HeroFigure
                        amount={amount}
                        currencySymbol={symbol}
                        variant="primary"
                        approximate={isApproximate}
                        testID={PassiveIncomeSelector.Earned}
                    />
                </Animated.View>
            </HeroFigureLockContext>

            <YieldHeroLine summary={summary} bucket={bucket} />
        </View>
    );
};
