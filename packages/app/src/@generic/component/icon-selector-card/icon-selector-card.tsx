import { UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { IconSelectorModalSelector } from '../../../app/icon-selector-modal.selector';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly onSelect: (icon: UserIconType) => void;
    readonly variant: ColorPaletteVariant;
    readonly label: string;
    readonly isSelected: boolean;
    readonly icon: UserIconType;
}

const tileVariants = cva('aspect-square flex-1 items-center justify-center rounded-3xl border-2 bg-surface-disc active:opacity-70', {
    variants: {
        isSelected: {
            true: 'border-primary',
            false: 'border-transparent'
        }
    }
});

export const IconSelectorCard = ({ isSelected, icon, label, onSelect, variant }: Props) => {
    const { t } = useLingui();
    const handleSelect = () => void onSelect(icon);
    const iconClassName = isSelected ? FOREGROUND_COLOR_PALETTE[variant] : FOREGROUND_COLOR_PALETTE.secondary;
    const accessibilityState = { selected: isSelected };

    return (
        <HapticPressable
            testID={IconSelectorModalSelector.IconCard(icon)}
            accessibilityRole="button"
            accessibilityLabel={t`Use ${label} icon`}
            accessibilityState={accessibilityState}
            className={tileVariants({ isSelected })}
            onPress={handleSelect}
        >
            <Icon className={cn(iconClassName)} icon={icon} size={24} />

            {isSelected ? (
                <View className="absolute right-[6px] top-[6px] h-[18px] w-[18px] items-center justify-center rounded-full bg-primary">
                    <Icon icon={UserIconNameEnum.Check} size={12} className="text-primary-reverse" />
                </View>
            ) : null}
        </HapticPressable>
    );
};
