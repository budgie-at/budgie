import { CategoryEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { typedObjectEntries } from '../../../@generic/utils/typed-object-entries.util';

interface Props extends Pick<CategoryEntityInterface, 'id' | 'icon' | 'title'> {
    readonly onSelect: (id: number) => void;
    readonly variant: ColorPaletteVariant;
    readonly isSelected: boolean;
    readonly className?: string;
    readonly testID?: string;
}

const cardVariants = cva(`flex-1 rounded-2xl p-sm gap-y-0.5 border-2 items-center h-[72px]`, {
    variants: {
        isSelected: {
            true: '',
            false: 'border-secondary-corner/50'
        },
        variant: Object.fromEntries(typedObjectEntries(BACKGROUND_COLOR_PALETTE).map(([variant]) => [variant, '']))
    },
    compoundVariants: typedObjectEntries(BACKGROUND_COLOR_PALETTE).map(([variant, className]) => ({
        variant,
        className,
        isSelected: true
    }))
});

const textVariants = cva('font-medium text-xs text-center leading-tight', {
    variants: {
        isSelected: {
            true: '',
            false: 'text-primary'
        },
        variant: Object.fromEntries(typedObjectEntries(FOREGROUND_COLOR_PALETTE).map(([variant]) => [variant, '']))
    },
    compoundVariants: typedObjectEntries(FOREGROUND_COLOR_PALETTE).map(([variant, className]) => ({
        variant,
        className,
        isSelected: true
    }))
});

export const CategorySelectorCard = (props: Props) => {
    const { className, isSelected, title, onSelect, id, icon, variant, testID } = props;

    const handleSelect = () => void onSelect(id);

    const iconVariant = isSelected ? variant : 'ghost';

    return (
        <HapticPressable testID={testID} className={cn(cardVariants({ isSelected, variant }), className)} onPress={handleSelect}>
            <CircleIcon size={28} iconSize={14} className="rounded-4xl" icon={icon} variant={iconVariant} border={false} />

            <View className="flex-1 justify-center">
                <Text className={textVariants({ isSelected, variant })} numberOfLines={2}>
                    {title}
                </Text>
            </View>
        </HapticPressable>
    );
};
