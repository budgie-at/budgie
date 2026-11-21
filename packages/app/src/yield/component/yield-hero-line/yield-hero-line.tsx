import { YieldDeltaKindEnum, YieldRangeEnum } from '@budgie/market';
import { Trans } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YIELD_HERO_LINE_MIN_HEIGHT } from '../../constant/yield-hero-metrics.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldHeroLineText } from '../../hook/use-yield-hero-line-text.hook';
import { useYieldIsEstimated } from '../../hook/use-yield-is-estimated.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldHeroDelta } from '../yield-hero-delta/yield-hero-delta';
import { YieldHeroNoDelta } from '../yield-hero-no-delta/yield-hero-no-delta';
import { YieldHeroScrubDelta } from '../yield-hero-scrub-delta/yield-hero-scrub-delta';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly bucket: YieldBucketInterface | null;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;
const LINE_COUNT = 2;
const LINE_STYLE = { minHeight: YIELD_HERO_LINE_MIN_HEIGHT };

export const YieldHeroLine = ({ summary, bucket }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const text = useYieldHeroLineText(summary, bucket);
    const isEstimated = useYieldIsEstimated(summary);

    const isNewHolding =
        summary.delta?.kind === YieldDeltaKindEnum.NEW && isDefined(summary.firstYieldDay) && summary.firstYieldDay >= summary.windowStart;
    const isDeltaMeaningful = isDefined(summary.delta) && (summary.delta.kind !== YieldDeltaKindEnum.NEW || isNewHolding);
    const hasDelta = isDeltaMeaningful && screenKey.key.range !== YieldRangeEnum.ALL;
    const delta = hasDelta ? <YieldHeroDelta summary={summary} /> : <YieldHeroNoDelta summary={summary} />;

    return (
        <View className="justify-center" style={LINE_STYLE}>
            <Text
                testID={PassiveIncomeSelector.YieldLine}
                maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={LINE_COUNT}
                className="text-[15px] tabular-nums text-secondary-foreground"
            >
                {text}
            </Text>
            {isEstimated ? (
                <Text maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] text-secondary-foreground">
                    <Trans>Includes estimated prices</Trans>
                </Text>
            ) : null}
            <View className="mt-[8px] items-start">
                {isDefined(bucket) ? <YieldHeroScrubDelta summary={summary} bucket={bucket} /> : delta}
            </View>
        </View>
    );
};
