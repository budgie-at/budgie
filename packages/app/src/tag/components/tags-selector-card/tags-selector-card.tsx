import { ReiconIconNameEnum, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ReiconIcon } from '../../../@generic/component/reicon-icon/reicon-icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TagVariantType } from '../../type/tag-variant.type';

import type { IconWeight } from 'reicon-react-native';

interface Props extends Pick<TagEntityInterface, 'id' | 'title'> {
    readonly onSelect: (id: number) => void;
    readonly variant: TagVariantType;
    readonly isSelected: boolean;
    readonly isPrimary?: boolean;
    readonly onPrimarySelect?: (id: number) => void;
    readonly className?: string;
    readonly testID?: string;
}

const STAR_SIZE = 14;
const CHIP_HIT_SLOP = { top: 4, bottom: 4 };
const filledStarIconWeight: IconWeight = 'Filled';

const cardVariants = cva('relative border-2 rounded-3xl px-xl py-sm items-center justify-center gap-x-md', {
    variants: {
        isSelected: { true: '', false: '' },
        isPrimary: { true: '', false: '' },
        variant: {
            static: 'h-[36px] flex-row gap-x-xs rounded-full px-[14px] py-0',
            removable: 'flex-none flex-row bg-primary border-primary py-md'
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
            className: 'border-transparent bg-surface-row'
        }
    ]
});

const textVariants = cva('text-[15px]', {
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
            className: 'text-primary'
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
    const { t } = useLingui();
    const handleSelect = () => void onSelect(id);
    const handlePrimarySelect = () => void onPrimarySelect?.(id);

    const longPressHandler = isDefined(onPrimarySelect) ? handlePrimarySelect : void 0;
    const showLeadingMark = variant === 'static' && isSelected;

    const accessibilityState = { selected: isSelected };
    const accessibilityLabel = isPrimary ? t`${title}, primary` : title;
    const accessibilityActions = isDefined(onPrimarySelect) && !isPrimary ? [{ name: 'makePrimary', label: t`Make primary` }] : [];

    return (
        <Animated.View layout={LinearTransition.springify()}>
            <HapticPressable
                testID={testID}
                className={cn(cardVariants({ isSelected, isPrimary, variant }), className)}
                onPress={handleSelect}
                onLongPress={longPressHandler}
                hitSlop={CHIP_HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityActions={accessibilityActions}
                onAccessibilityAction={handlePrimarySelect}
                accessibilityState={accessibilityState}
            >
                {showLeadingMark && isPrimary ? (
                    <ReiconIcon
                        icon={ReiconIconNameEnum.STAR}
                        size={STAR_SIZE}
                        weight={filledStarIconWeight}
                        className="text-primary-reverse"
                    />
                ) : null}

                <Text className={textVariants({ isSelected, isPrimary, variant })} numberOfLines={1} ellipsizeMode="tail">
                    {title}
                </Text>

                {variant === 'removable' ? <Icon icon={UserIconNameEnum.X} className="text-primary-reverse" size={14} /> : null}
            </HapticPressable>
        </Animated.View>
    );
};
