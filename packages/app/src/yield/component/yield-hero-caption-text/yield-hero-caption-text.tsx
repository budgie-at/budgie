import { Text } from 'react-native';

import { YIELD_HERO_CAPTION_HEIGHT } from '../../constant/yield-hero-metrics.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const CAPTION_MAX_FONT_SIZE_MULTIPLIER = 1.5;
const CAPTION_STYLE = { minHeight: YIELD_HERO_CAPTION_HEIGHT };

export const YieldHeroCaptionText = ({ children }: Props) => (
    <Text
        testID={PassiveIncomeSelector.Caption}
        numberOfLines={2}
        style={CAPTION_STYLE}
        maxFontSizeMultiplier={CAPTION_MAX_FONT_SIZE_MULTIPLIER}
        className="text-[13px] tabular-nums text-secondary-foreground"
    >
        {children}
    </Text>
);
