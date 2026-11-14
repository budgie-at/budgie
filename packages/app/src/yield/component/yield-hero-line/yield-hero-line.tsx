import { YieldRangeEnum } from '@budgie/market';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useIsLargeText } from '../../../@generic/hook/use-is-large-text.hook';
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
const LARGE_TEXT_LINES = 2;
const SINGLE_LINE = 1;

export const YieldHeroLine = ({ summary, bucket }: Props) => {
    const { screenKey } = use(YieldScreenContext);
    const isLargeText = useIsLargeText();
    const text = useYieldHeroLineText(summary, bucket);

    const isDeltaVisible = isDefined(summary.delta) && screenKey.key.range !== YieldRangeEnum.ALL && !isDefined(bucket);
    const lineCount = isLargeText ? LARGE_TEXT_LINES : SINGLE_LINE;
    const lineClassName = cn(
        'min-h-[22px]',
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
                numberOfLines={lineCount}
                className="shrink text-[15px] tabular-nums text-secondary-foreground"
            >
                {text}
            </Text>
            {isDeltaVisible ? <YieldHeroDelta summary={summary} /> : null}
        </View>
    );
};
