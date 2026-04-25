import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

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
}

const cardVariants = cva(`relative border-2 rounded-3xl px-xl items-center justify-center gap-x-md`, {
    variants: {
        isSelected: {
            true: '',
            false: ''
        },
        isPrimary: {
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
        },
        {
            isPrimary: true,
            variant: 'static',
            className: 'border-dark-warning-foreground border-[3px]'
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
    testID
}: Props) => {
    const handleSelect = () => void onSelect(id);
    const handlePrimarySelect = () => void onPrimarySelect?.(id);

    const numberOfLines = variant === 'static' ? 2 : 1;
    const longPressHandler = isDefined(onPrimarySelect) ? handlePrimarySelect : void 0;

    return (
        <Animated.View className="flex-1" layout={LinearTransition.springify()}>
            <HapticPressable
                testID={testID}
                className={cn(cardVariants({ isSelected, isPrimary, variant }), className)}
                onPress={handleSelect}
                onLongPress={longPressHandler}
            >
                <Text className={cn(textVariants({ isSelected, variant }), 'text-center')} numberOfLines={numberOfLines}>
                    {title}
                </Text>

                {variant === 'removable' ? <Icon icon={UserIconNameEnum.X} className="text-primary-reverse" size={14} /> : null}
            </HapticPressable>
        </Animated.View>
    );
};
