import { YieldDeltaKindEnum, YieldRangeEnum } from '@budgie/market';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldHeroLineText } from '../../hook/use-yield-hero-line-text.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldHeroDelta } from '../yield-hero-delta/yield-hero-delta';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly bucket: YieldBucketInterface | null;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;
const LINE_COUNT = 2;

export const YieldHeroLine = ({ summary, bucket }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const text = useYieldHeroLineText(summary, bucket);

    const isNewHolding =
        summary.delta?.kind === YieldDeltaKindEnum.NEW && isDefined(summary.firstYieldDay) && summary.firstYieldDay >= summary.windowStart;
    const isDeltaMeaningful = isDefined(summary.delta) && (summary.delta.kind !== YieldDeltaKindEnum.NEW || isNewHolding);
    const isDeltaVisible = isDeltaMeaningful && screenKey.key.range !== YieldRangeEnum.ALL && !isDefined(bucket);
    const lineClassName = cn(
        'min-h-[44px]',
        'flex-row',
        'flex-wrap',
        'items-center',
        'gap-x-sm',
        !isNotEmptyString(text) && !isDeltaVisible && 'opacity-0'
    );

    return (
        <View className={lineClassName}>
            <Text
                testID={PassiveIncomeSelector.YieldLine}
                maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={LINE_COUNT}
                className="shrink text-[15px] tabular-nums text-secondary-foreground"
            >
                {text}
            </Text>
            {isDeltaVisible ? <YieldHeroDelta summary={summary} /> : null}
        </View>
    );
};
