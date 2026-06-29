import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { isDefined, isNotEmptyString, isString } from '@rnw-community/shared';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { TestIDPartEnum } from '../../enum/test-id-part.enum';
import { ButtonSizeType } from '../../type/button-size.type';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { testID as testIDProps } from '../../utils/test-id.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props extends ComponentProps<typeof HapticPressable> {
    readonly content?: ReactNode;
    readonly leftIcon?: UserIconNameEnum;
    readonly rightIcon?: UserIconNameEnum;
    readonly size?: ButtonSizeType;
    readonly variant?: ColorPaletteVariant;
    readonly isLoading?: boolean;
}

const buttonVariants = cva<{
    variant: Record<ColorPaletteVariant, ClassValue>;
    size: Record<ButtonSizeType, ClassValue>;
    disabled: Record<'true', ClassValue>;
}>('relative flex-row items-center gap-x-xl justify-center border', {
    variants: {
        disabled: { true: 'opacity-50' },
        variant: BACKGROUND_COLOR_PALETTE,
        size: {
            sm: 'rounded-2xl p-2xl',
            md: 'rounded-3xl p-3xl'
        }
    }
});

const textVariants = cva<{
    size: Record<ButtonSizeType, ClassValue>;
    variant: Record<ColorPaletteVariant, ClassValue>;
}>('', {
    variants: {
        size: {
            sm: 'font-medium text-sm',
            md: 'font-semibold text-md'
        },
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const Button = (props: Props) => {
    const {
        content,
        className,
        onPress,
        disabled,
        leftIcon,
        rightIcon,
        variant = 'ghost',
        size = 'md',
        isLoading,
        testID,
        accessibilityLabel,
        accessibilityRole = 'button',
        ...rest
    } = props;

    const isDisabled = disabled || isLoading;
    const resolvedAccessibilityLabel = accessibilityLabel ?? (isString(content) ? content : testID);
    const hasTestID = isNotEmptyString(testID);

    return (
        <HapticPressable
            onPress={onPress}
            disabled={isDisabled}
            className={cn(buttonVariants({ disabled: isDisabled, size, variant }), className)}
            testID={testID}
            collapsable={false}
            nativeID={testID}
            accessible
            accessibilityLabel={resolvedAccessibilityLabel}
            accessibilityRole={accessibilityRole}
            {...rest}
        >
            {hasTestID ? <View collapsable={false} nativeID={testID} style={StyleSheet.absoluteFill} testID={testID} /> : null}

            {isLoading ? (
                <ActivityIndicator size="small" />
            ) : (
                <>
                    {isNotEmptyString(leftIcon) ? <Icon className={textVariants({ variant })} size={16} icon={leftIcon} /> : null}

                    {isDefined(content) && (
                        <Text className={textVariants({ variant })} {...testIDProps(testID, TestIDPartEnum.LABEL)}>
                            {content}
                        </Text>
                    )}

                    {isNotEmptyString(rightIcon) ? <Icon className={textVariants({ variant })} size={16} icon={rightIcon} /> : null}
                </>
            )}
        </HapticPressable>
    );
};
