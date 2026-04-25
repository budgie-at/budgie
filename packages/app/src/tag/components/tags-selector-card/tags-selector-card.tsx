import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';
import Animated, { LinearTransition, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { light } from '../../../theme/provider/theme.provider';
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

const STAR_SIZE = 13;
const PRIMARY_SCALE = 1.04;
const NORMAL_SCALE = 1;
const SCALE_SPRING = { damping: 14, stiffness: 220 };
const PRIMARY_STAR_FILL = light['--color-dark-warning-foreground'];
const TRANSPARENT_FILL = 'transparent';

const cardVariants = cva('relative border-2 rounded-3xl px-xl items-center justify-center gap-x-md', {
    variants: {
        isSelected: { true: '', false: '' },
        isPrimary: { true: '', false: '' },
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

const textVariants = cva('text-sm', {
    variants: {
        isSelected: { true: '', false: '' },
        isPrimary: { true: '', false: '' },
        variant: {
            static: 'font-medium',
            removable: 'text-primary-reverse font-medium'
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
        },
        {
            isPrimary: true,
            isSelected: true,
            variant: 'static',
            className: 'font-bold'
        }
    ]
});

const starVariants = cva('', {
    variants: {
        isPrimary: {
            true: 'text-dark-warning-foreground',
            false: 'text-primary-reverse opacity-40'
        }
    }
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
    const showStarBadge = variant === 'static' && isSelected;
    const starFill = isPrimary ? PRIMARY_STAR_FILL : TRANSPARENT_FILL;

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(isPrimary ? PRIMARY_SCALE : NORMAL_SCALE, SCALE_SPRING) }]
    }));

    return (
        <Animated.View className="flex-1" layout={LinearTransition.springify()}>
            <Animated.View className="flex-1" style={scaleStyle}>
                <HapticPressable
                    testID={testID}
                    className={cn(cardVariants({ isSelected, isPrimary, variant }), className)}
                    onPress={handleSelect}
                    onLongPress={longPressHandler}
                >
                    <Text className={cn(textVariants({ isSelected, isPrimary, variant }), 'text-center')} numberOfLines={numberOfLines}>
                        {title}
                    </Text>

                    {showStarBadge ? (
                        <View className="absolute top-1.5 right-1.5">
                            <Icon icon={UserIconNameEnum.Star} size={STAR_SIZE} fill={starFill} className={starVariants({ isPrimary })} />
                        </View>
                    ) : null}

                    {variant === 'removable' ? <Icon icon={UserIconNameEnum.X} className="text-primary-reverse" size={14} /> : null}
                </HapticPressable>
            </Animated.View>
        </Animated.View>
    );
};
