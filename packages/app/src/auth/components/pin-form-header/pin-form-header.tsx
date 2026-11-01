import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { PIN_STEP_FADE_DURATION_MS } from '../../constant/pin-motion.constant';
import { useIsCompactPinLayout } from '../../hook/use-is-compact-pin-layout.hook';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly icon?: UserIconNameEnum | null;
    readonly iconVariant?: ColorPaletteVariant;
}

const COMPACT_TILE_SIZE = 44;
const REGULAR_TILE_SIZE = 56;
const COMPACT_GLYPH_SIZE = 22;
const REGULAR_GLYPH_SIZE = 26;

export const PinFormHeader = ({ title, description, icon = UserIconNameEnum.LockKeyhole, iconVariant = 'secondary' }: Props) => {
    const isCompact = useIsCompactPinLayout();
    const previousTitleRef = useRef(title);

    const gapClassName = isCompact ? 'gap-y-3xl' : 'gap-y-5xl';
    const descriptionMinHeightClassName = isCompact ? 'min-h-[40px]' : 'min-h-[60px]';
    const tileSize = isCompact ? COMPACT_TILE_SIZE : REGULAR_TILE_SIZE;
    const glyphSize = isCompact ? COMPACT_GLYPH_SIZE : REGULAR_GLYPH_SIZE;

    useEffect(() => {
        if (previousTitleRef.current !== title) {
            AccessibilityInfo.announceForAccessibility(title);
        }

        previousTitleRef.current = title;
    }, [title]);

    return (
        <Animated.View key={title} entering={FadeIn.duration(PIN_STEP_FADE_DURATION_MS)} className={cn('items-center', gapClassName)}>
            {isDefined(icon) ? (
                <CircleIcon icon={icon} variant={iconVariant} size={tileSize} iconSize={glyphSize} className="rounded-3xl" />
            ) : null}

            <View className="items-center gap-y-md px-xl">
                <Text
                    className="text-3xl font-semibold tracking-tight text-primary text-center"
                    testID={PinFormSelector.Title}
                    accessibilityRole="header"
                    maxFontSizeMultiplier={1.4}
                >
                    {title}
                </Text>

                <Text
                    className={cn('text-sm text-secondary-foreground text-center max-w-[300px]', descriptionMinHeightClassName)}
                    maxFontSizeMultiplier={1.6}
                >
                    {description}
                </Text>
            </View>
        </Animated.View>
    );
};
