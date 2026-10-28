import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly label: string;
    readonly variant: ColorPaletteVariant;
    readonly textSizeClassName: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

const CHEVRON_SIZE = 16;

export const ChevronLinkRow = ({ label, variant, textSizeClassName, onPress, testID }: Props) => {
    const toneClassName = cn(FOREGROUND_COLOR_PALETTE[variant]);

    return (
        <HapticPressable
            accessibilityLabel={label}
            accessibilityRole="button"
            className="min-h-[44px] flex-row items-center gap-x-xs self-start active:opacity-70"
            testID={testID}
            onPress={onPress}
        >
            <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className={cn('shrink', textSizeClassName, toneClassName)}>
                {label}
            </Text>
            <Icon icon={UserIconNameEnum.ChevronRight} size={CHEVRON_SIZE} className={toneClassName} />
        </HapticPressable>
    );
};
