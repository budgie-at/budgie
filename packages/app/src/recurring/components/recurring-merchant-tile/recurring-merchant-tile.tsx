import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { getRecurringTileVariant } from '../../utils/get-recurring-tile-variant.util';

import type { RecurringTileVariantEnum } from '../../enum/recurring-tile-variant.enum';

interface Props {
    readonly title: string;
    readonly size: number;
    readonly variant?: RecurringTileVariantEnum;
}

const TILE_CLASS_NAMES: Record<RecurringTileVariantEnum, string> = {
    VIOLET: 'bg-violet-foreground/16 dark:bg-violet-foreground/26',
    CYAN: 'bg-cyan-foreground/16 dark:bg-cyan-foreground/26',
    PINK: 'bg-pink-foreground/16 dark:bg-pink-foreground/26',
    POSITIVE: 'bg-positive-foreground/16 dark:bg-positive-foreground/26',
    WARNING: 'bg-warning-foreground/16 dark:bg-warning-foreground/26',
    DEFAULT: 'bg-default-foreground/16 dark:bg-default-foreground/26',
    BLUE: 'bg-chart-1/16 dark:bg-chart-1/30',
    ORANGE: 'bg-chart-2/16 dark:bg-chart-2/30',
    TEAL: 'bg-chart-3/16 dark:bg-chart-3/30',
    AMBER: 'bg-chart-4/16 dark:bg-chart-4/30',
    ROSE: 'bg-chart-5/16 dark:bg-chart-5/30',
    INDIGO: 'bg-chart-6/16 dark:bg-chart-6/30',
    NEUTRAL: 'bg-surface-fill'
};

const LETTER_CLASS_NAMES: Record<RecurringTileVariantEnum, string> = {
    VIOLET: 'text-violet-foreground',
    CYAN: 'text-cyan-foreground',
    PINK: 'text-pink-foreground',
    POSITIVE: 'text-positive-foreground',
    WARNING: 'text-warning-foreground',
    DEFAULT: 'text-default-foreground',
    BLUE: 'text-chart-1',
    ORANGE: 'text-chart-2',
    TEAL: 'text-chart-3',
    AMBER: 'text-chart-4',
    ROSE: 'text-chart-5',
    INDIGO: 'text-chart-6',
    NEUTRAL: 'text-secondary-foreground'
};

const tileVariants = cva('items-center justify-center', { variants: { variant: TILE_CLASS_NAMES } });

const letterVariants = cva('font-bold', { variants: { variant: LETTER_CLASS_NAMES } });

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringMerchantTile = ({ title, size, variant = getRecurringTileVariant(title) }: Props) => {
    const letter = Array.from(title.trim())[0]?.toUpperCase() ?? '';
    const tileStyle = [continuousCorners, { width: size, height: size, borderRadius: Math.round(size * 0.28) }];
    const letterStyle = { fontSize: Math.round(size * 0.46), lineHeight: Math.round(size * 0.56) };

    return (
        <View
            className={tileVariants({ variant })}
            style={tileStyle}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Text allowFontScaling={false} className={letterVariants({ variant })} style={letterStyle}>
                {letter}
            </Text>
        </View>
    );
};
