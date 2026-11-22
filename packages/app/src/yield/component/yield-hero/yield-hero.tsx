import { useAtomValue } from '@effect/atom-react/Hooks';
import { use } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { HeroFigureLockContext } from '../../../@generic/context/hero-figure-lock.context';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { useYieldHeroSentence } from '../../hook/use-yield-hero-sentence.hook';
import { useYieldIsEstimated } from '../../hook/use-yield-is-estimated.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { sumYieldScrubbedBuckets } from '../../utils/sum-yield-scrubbed-buckets.util';
import { YieldHeroCaption } from '../yield-hero-caption/yield-hero-caption';
import { YieldHeroInfoButton } from '../yield-hero-info-button/yield-hero-info-button';
import { YieldHeroLine } from '../yield-hero-line/yield-hero-line';
import { YieldHeroPricesStatus } from '../yield-hero-prices-status/yield-hero-prices-status';
import { YieldHeroSkeleton } from '../yield-hero-skeleton/yield-hero-skeleton';

export const YieldHero = () => {
    const { mode, rangeCaption } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const summary = useYieldSummary();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const bucket = isDefined(selectedIndex) ? (summary?.buckets.at(selectedIndex) ?? null) : null;
    const scrubAmount = sumYieldScrubbedBuckets(summary?.buckets ?? [], selectedIndex, mode).total;
    const amount = isDefined(bucket) ? scrubAmount : (summary?.earned.value ?? 0);
    const isApproximate = useYieldIsEstimated(summary);
    const sentence = useYieldHeroSentence(summary, rangeCaption, bucket, scrubAmount);
    const figureLock = isDefined(summary) ? { amount: summary.earned.value, approximate: summary.earned.isEstimated } : null;

    if (!isDefined(summary)) {
        return <YieldHeroSkeleton />;
    }

    return (
        <View className="gap-y-xs" testID={PassiveIncomeSelector.Hero}>
            <View className="flex-row items-center gap-x-[4px]">
                <View className="shrink">
                    <YieldHeroCaption summary={summary} bucket={bucket} />
                </View>
                <YieldHeroInfoButton />
                <YieldHeroPricesStatus summary={summary} />
            </View>

            <View accessible accessibilityLabel={sentence} className="gap-y-xs">
                <HeroFigureLockContext value={figureLock}>
                    <View className="pr-[16px]">
                        <HeroFigure
                            amount={amount}
                            currencySymbol={symbol}
                            variant="primary"
                            approximate={isApproximate}
                            testID={PassiveIncomeSelector.Earned}
                        />
                    </View>
                </HeroFigureLockContext>

                <YieldHeroLine summary={summary} bucket={bucket} />
            </View>
        </View>
    );
};
