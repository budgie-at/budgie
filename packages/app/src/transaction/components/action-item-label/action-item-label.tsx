import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { ClassValue } from 'cn';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
}

const ICON_SIZE = 20;
const actionItemBackgroundColorPalette: Record<ColorPaletteVariant, ClassValue> = {
    ...BACKGROUND_COLOR_PALETTE,
    secondary: 'bg-secondary-foreground/10',
    positive: 'bg-positive-foreground/30',
    warning: 'bg-warning-foreground/30',
    destructive: 'bg-destructive-foreground/25',
    violet: 'bg-violet-foreground/45'
};

const containerVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'w-12 h-12 rounded-full items-center justify-center border-0',
    { variants: { variant: actionItemBackgroundColorPalette } }
);

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const ActionItemLabel = ({ icon, label, testID, variant }: Props) => (
    <View className="flex-row-reverse items-center p-sm">
        <View className={containerVariants({ variant })}>
            <Icon className={iconVariants({ variant })} icon={icon} size={ICON_SIZE} />
        </View>
        <Text className="text-white text-sm font-medium mr-lg" {...testIDProps(testID, TestIDPartEnum.LABEL)}>
            {label}
        </Text>
    </View>
);
