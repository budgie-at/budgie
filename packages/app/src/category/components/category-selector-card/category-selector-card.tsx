import { CategoryEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { typedObjectEntries } from '../../../@generic/utils/typed-object-entries.util';

interface Props extends Pick<CategoryEntityInterface, 'id' | 'icon' | 'title'> {
    readonly onSelect: (id: number) => void;
    readonly variant: ColorPaletteVariant;
    readonly isSelected: boolean;
    readonly className?: string;
}

const cardVariants = cva(`flex-1 rounded-3xl p-3xl border-2 gap-y-md justify-between`, {
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

const textVariants = cva('font-medium text-sm', {
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
    const { className, isSelected, title, onSelect, id, icon, variant } = props;

    const handleSelect = () => void onSelect(id);

    const iconVariant = isSelected ? variant : 'ghost';

    return (
        <HapticPressable disabled={isSelected} className={cn(cardVariants({ isSelected, variant }), className)} onPress={handleSelect}>
            <CircleIcon size="lg" className="rounded-5xl" icon={ICONS[icon]} variant={iconVariant} border={false} />

            <Text className={textVariants({ isSelected, variant })}>{title}</Text>
        </HapticPressable>
    );
};
