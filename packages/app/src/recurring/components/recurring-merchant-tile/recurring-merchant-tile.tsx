import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { getRecurringTileVariant } from '../../utils/get-recurring-tile-variant.util';

import type { RecurringTileVariantEnum } from '../../enum/recurring-tile-variant.enum';

interface Props {
    readonly title: string;
    readonly size: number;
}

const TILE_CLASS_NAMES: Record<RecurringTileVariantEnum, string> = {
    VIOLET: 'bg-violet-foreground/16',
    CYAN: 'bg-cyan-foreground/16',
    PINK: 'bg-pink-foreground/16',
    POSITIVE: 'bg-positive-foreground/16',
    WARNING: 'bg-warning-foreground/16',
    DEFAULT: 'bg-default-foreground/16'
};

const LETTER_CLASS_NAMES: Record<RecurringTileVariantEnum, string> = {
    VIOLET: 'text-violet-foreground',
    CYAN: 'text-cyan-foreground',
    PINK: 'text-pink-foreground',
    POSITIVE: 'text-positive-foreground',
    WARNING: 'text-warning-foreground',
    DEFAULT: 'text-default-foreground'
};

const tileVariants = cva('items-center justify-center', { variants: { variant: TILE_CLASS_NAMES } });

const letterVariants = cva('font-bold', { variants: { variant: LETTER_CLASS_NAMES } });

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringMerchantTile = ({ title, size }: Props) => {
    const variant = getRecurringTileVariant(title);
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
