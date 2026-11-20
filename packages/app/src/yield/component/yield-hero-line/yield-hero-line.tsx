import { YieldDeltaKindEnum, YieldRangeEnum } from '@budgie/market';
import { cva } from 'class-variance-authority';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { YIELD_HERO_LINE_MIN_HEIGHT } from '../../constant/yield-hero-metrics.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldHeroLineText } from '../../hook/use-yield-hero-line-text.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldHeroDelta } from '../yield-hero-delta/yield-hero-delta';
import { YieldHeroNoDelta } from '../yield-hero-no-delta/yield-hero-no-delta';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly bucket: YieldBucketInterface | null;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;
const LINE_COUNT = 2;
const LINE_STYLE = { minHeight: YIELD_HERO_LINE_MIN_HEIGHT };

const lineVariants = cva('justify-center', { variants: { isHidden: { true: 'opacity-0', false: '' } } });
const deltaVariants = cva('mt-[8px] items-start', { variants: { isHidden: { true: 'opacity-0', false: '' } } });
const deltaAccessibilityModes: Record<string, 'auto' | 'no-hide-descendants'> = { true: 'auto', false: 'no-hide-descendants' };

export const YieldHeroLine = ({ summary, bucket }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const text = useYieldHeroLineText(summary, bucket);

    const isNewHolding =
        summary.delta?.kind === YieldDeltaKindEnum.NEW && isDefined(summary.firstYieldDay) && summary.firstYieldDay >= summary.windowStart;
    const isDeltaMeaningful = isDefined(summary.delta) && (summary.delta.kind !== YieldDeltaKindEnum.NEW || isNewHolding);
    const hasDelta = isDeltaMeaningful && screenKey.key.range !== YieldRangeEnum.ALL;
    const isDeltaVisible = !isDefined(bucket);
    const isLineHidden = !isNotEmptyString(text) && !isDeltaVisible;
    const lineClassName = lineVariants({ isHidden: isLineHidden });
    const deltaClassName = deltaVariants({ isHidden: !isDeltaVisible });
    const deltaAccessibility = deltaAccessibilityModes[String(isDeltaVisible)];

    return (
        <View className={lineClassName} style={LINE_STYLE}>
            <Text
                testID={PassiveIncomeSelector.YieldLine}
                maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={LINE_COUNT}
                className="text-[15px] tabular-nums text-secondary-foreground"
            >
                {text}
            </Text>
            <View className={deltaClassName} importantForAccessibility={deltaAccessibility}>
                {hasDelta ? <YieldHeroDelta summary={summary} /> : <YieldHeroNoDelta />}
            </View>
        </View>
    );
};
