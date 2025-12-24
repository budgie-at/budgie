import { TagEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { TagVariantType } from '../../type/tag-variant.type';

interface Props extends Pick<TagEntityInterface, 'id' | 'title'> {
    readonly onSelect: (id: number) => void;
    readonly variant: TagVariantType;
    readonly isSelected: boolean;
    readonly className?: string;
}

const cardVariants = cva(`border-2 rounded-7xl px-2xl flex-row items-center gap-x-md`, {
    variants: {
        isSelected: {
            true: '',
            false: ''
        },
        variant: {
            static: 'py-xl',
            removable: 'bg-primary border-primary py-md'
        }
    },
    compoundVariants: [
        {
            isSelected: true,
            variant: 'static',
            className: 'border-secondary-foreground'
        },
        {
            isSelected: false,
            variant: 'static',
            className: 'border-secondary-corner'
        }
    ]
});

const textVariants = cva('font-medium text-sm', {
    variants: {
        isSelected: {
            true: '',
            false: ''
        },
        variant: {
            static: '',
            removable: 'text-primary-reverse'
        }
    },
    compoundVariants: [
        {
            isSelected: true,
            variant: 'static',
            className: 'text-primary'
        },
        {
            isSelected: false,
            variant: 'static',
            className: 'text-secondary-foreground'
        }
    ]
});

export const TagsSelectorCard = ({ className, isSelected, title, variant, onSelect, id }: Props) => {
    const handleSelect = () => void onSelect(id);

    return (
        <HapticPressable className={cn(cardVariants({ isSelected, variant }), className)} onPress={handleSelect}>
            <Text className={textVariants({ isSelected, variant })}>{title}</Text>

            {variant === 'removable' ? <Icon icon={ICONS.X} className="text-primary-reverse" size={14} /> : null}
        </HapticPressable>
    );
};
