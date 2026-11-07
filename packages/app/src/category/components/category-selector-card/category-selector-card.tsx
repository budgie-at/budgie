import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { StyleSheet, Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
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

const cardVariants = cva(`flex-1 rounded-2xl px-sm pt-md border-2 items-center min-h-[92px]`, {
    variants: {
        isSelected: {
            true: '',
            false: 'border-transparent bg-surface-row'
        }
    }
});

const textVariants = cva('font-medium text-[13px] leading-[16px] text-center', {
    variants: {
        isSelected: {
            true: 'text-primary font-semibold',
            false: 'text-primary'
        }
    }
});

export const CategorySelectorCard = (props: Props) => {
    const { className, isSelected, title, onSelect, id, icon, testID } = props;

    const handleSelect = () => void onSelect(id);

    const hasTestID = isNotEmptyString(testID);
    const largeText = useIsAccessibilityTextSize();
    const iconClassName = 'rounded-4xl bg-surface-fill';
    const titleStyle = largeText ? { flex: 1, paddingLeft: 16 } : { alignSelf: 'stretch' as const, paddingTop: 6 };
    const textLines = largeText ? {} : { numberOfLines: 2 };
    const accessibilityState = { selected: isSelected };

    return (
        <HapticPressable
            className={cn(
                cardVariants({ isSelected }),
                isSelected && 'border-primary/30 bg-surface-fill',
                'relative pb-md',
                largeText && 'flex-row px-xl py-lg',
                className
            )}
            onPress={handleSelect}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
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

            {isSelected ? (
                <View className="absolute top-[8px] right-[8px] rounded-full bg-primary p-[2px]" pointerEvents="none">
                    <Icon icon={UserIconNameEnum.Check} size={10} className="text-primary-reverse" />
                </View>
            ) : null}

            <CircleIcon size={36} iconSize={19} className={iconClassName} icon={icon} variant="secondary" border={false} />

            <View style={titleStyle}>
                <Text
                    className={cn(
                        textVariants({ isSelected }),
                        'self-stretch flex-shrink',
                        largeText && 'text-left text-[17px] leading-[24px] pr-xl'
                    )}
                    maxFontSizeMultiplier={2}
                    lineBreakStrategyIOS="standard"
                    {...textLines}
                    {...testIDProps(testID, TestIDPartEnum.LABEL)}
                >
                    {title}
                </Text>
            </View>
        </HapticPressable>
    );
};
