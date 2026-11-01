import { CategoryEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { StyleSheet, Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

interface Props extends Pick<CategoryEntityInterface, 'id' | 'icon' | 'title'> {
    readonly onSelect: (id: number) => void;
    readonly variant: ColorPaletteVariant;
    readonly isSelected: boolean;
    readonly className?: string;
    readonly testID?: string;
}

const cardVariants = cva(`flex-1 rounded-2xl px-sm py-xs gap-y-0.5 border-2 items-center min-h-[72px]`, {
    variants: {
        isSelected: {
            true: '',
            false: 'border-secondary-corner/50'
        }
    }
});

const textVariants = cva('font-medium text-(length:--text-xs) text-center', {
    variants: {
        isSelected: {
            true: '',
            false: 'text-secondary-foreground'
        }
    }
});

export const CategorySelectorCard = (props: Props) => {
    const { className, isSelected, title, onSelect, id, icon, variant, testID } = props;

    const handleSelect = () => void onSelect(id);

    const iconVariant = isSelected ? variant : 'ghost';
    const hasTestID = isNotEmptyString(testID);
    const accessibilityState = { selected: isSelected };

    return (
        <HapticPressable
            className={cn(cardVariants({ isSelected }), isSelected && BACKGROUND_COLOR_PALETTE[variant], 'relative', className)}
            onPress={handleSelect}
            testID={testID}
            collapsable={false}
            nativeID={testID}
            accessible
            accessibilityLabel={title}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
        >
            {hasTestID ? (
                <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
            ) : null}

            <CircleIcon size={24} iconSize={13} className="rounded-4xl" icon={icon} variant={iconVariant} border={false} />

            <View className="self-stretch flex-1 justify-center">
                <Text
                    className={cn(
                        textVariants({ isSelected }),
                        isSelected && FOREGROUND_COLOR_PALETTE[variant],
                        'self-stretch flex-shrink'
                    )}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    {...testIDProps(testID, TestIDPartEnum.LABEL)}
                >
                    {title}
                </Text>
            </View>
        </HapticPressable>
    );
};
