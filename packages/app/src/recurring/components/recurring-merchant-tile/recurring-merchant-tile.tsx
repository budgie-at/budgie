import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { getRecurringTileVariant } from '../../utils/get-recurring-tile-variant.util';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconType } from '@budgie/contracts';
import type { ClassValue } from 'cn';

interface Props {
    readonly categoryIcon: UserIconType | null;
    readonly title: string;
    readonly size: number;
}

const tileVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('items-center justify-center', {
    variants: { variant: BACKGROUND_COLOR_PALETTE }
});

const letterVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('font-bold', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringMerchantTile = ({ categoryIcon, title, size }: Props) => {
    const variant = getRecurringTileVariant(title);
    const letter = Array.from(title.trim())[0]?.toUpperCase() ?? '';
    const badgeSize = Math.round(size * 0.42);
    const tileStyle = [continuousCorners, { width: size, height: size, borderRadius: Math.round(size * 0.28) }];
    const letterStyle = { fontSize: Math.round(size * 0.46), lineHeight: Math.round(size * 0.56) };
    const frameStyle = { width: size, height: size };
    const badgeStyle = { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, right: -3, bottom: -3 };

    return (
        <View style={frameStyle} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View className={tileVariants({ variant })} style={tileStyle}>
                <Text allowFontScaling={false} className={letterVariants({ variant })} style={letterStyle}>
                    {letter}
                </Text>
            </View>
            {isDefined(categoryIcon) ? (
                <View
                    className="absolute items-center justify-center border-2 border-grouped-surface-row bg-grouped-surface-row"
                    style={badgeStyle}
                >
                    <Icon icon={categoryIcon} size={Math.round(badgeSize * 0.6)} className="text-secondary-foreground" />
                </View>
            ) : null}
        </View>
    );
};
