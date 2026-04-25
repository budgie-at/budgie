import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { GestureResponderEvent, Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TagVariantType } from '../../type/tag-variant.type';

interface Props extends Pick<TagEntityInterface, 'id' | 'title'> {
    readonly onSelect: (id: number) => void;
    readonly variant: TagVariantType;
    readonly isSelected: boolean;
    readonly isPrimary?: boolean;
    readonly onPrimarySelect?: (id: number) => void;
    readonly className?: string;
    readonly testID?: string;
    readonly primaryTestID?: string;
    readonly primaryLabel?: string;
    readonly makePrimaryLabel?: string;
}

const cardVariants = cva(`relative border-2 rounded-3xl px-xl items-center justify-center gap-x-md`, {
    variants: {
        isSelected: {
            true: '',
            false: ''
        },
        variant: {
            static: 'flex-1 h-[56px]',
            removable: 'flex-none flex-row bg-primary border-primary py-md px-2xl'
        }
    },
    compoundVariants: [
        {
            isSelected: true,
            variant: 'static',
            className: 'bg-primary border-primary'
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
            className: 'text-primary-reverse'
        },
        {
            isSelected: false,
            variant: 'static',
            className: 'text-secondary-foreground'
        }
    ]
});

export const TagsSelectorCard = ({
    className,
    isSelected,
    isPrimary = false,
    title,
    variant,
    onSelect,
    onPrimarySelect,
    id,
    testID,
    primaryTestID,
    primaryLabel,
    makePrimaryLabel
}: Props) => {
    const handleSelect = () => void onSelect(id);
    const handlePrimarySelect = (event: GestureResponderEvent) => {
        event.stopPropagation();
        onPrimarySelect?.(id);
    };

    const numberOfLines = variant === 'static' ? 2 : 1;
    const showPrimaryAction = isSelected && isDefined(onPrimarySelect);
    const primaryIcon = isPrimary ? UserIconNameEnum.Crown : UserIconNameEnum.Star;
    const accessibilityLabel = isPrimary ? primaryLabel : makePrimaryLabel;

    return (
        <HapticPressable testID={testID} className={cn(cardVariants({ isSelected, variant }), className)} onPress={handleSelect}>
            <Text className={cn(textVariants({ isSelected, variant }), 'text-center')} numberOfLines={numberOfLines}>
                {title}
            </Text>

            {showPrimaryAction ? (
                <HapticPressable
                    accessibilityLabel={accessibilityLabel}
                    testID={primaryTestID}
                    className="absolute right-xs top-xs rounded-full bg-primary-reverse/20 p-xs"
                    onPress={handlePrimarySelect}
                >
                    <Icon icon={primaryIcon} className="text-primary-reverse" size={12} />
                </HapticPressable>
            ) : null}

            {variant === 'removable' ? <Icon icon={UserIconNameEnum.X} className="text-primary-reverse" size={14} /> : null}
        </HapticPressable>
    );
};
