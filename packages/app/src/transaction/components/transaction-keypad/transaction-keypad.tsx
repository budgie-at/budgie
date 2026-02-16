import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { TransactionKeypadButton } from '../transaction-keypad-button/transaction-keypad-button';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

const FLEX_ANIMATION_DURATION = 300;
const GEAR_SPIN_DURATION = 600;
const CONFIRM_FLEX_DEFAULT = 2;
const CONFIRM_FLEX_SPLIT = 1.3;
const GEAR_FLEX = 0.7;
const FULL_ROTATION = 360;

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly onDigit: (digit: string) => void;
    readonly onDecimal: () => void;
    readonly onBackspace: () => void;
    readonly onLongBackspace: () => void;
    readonly onConfirm: () => void;
    readonly onCancel: () => void;
    readonly isConfirmDisabled?: boolean;
    readonly confirmTestID?: string;
    readonly showAutomateButton?: boolean;
    readonly onAutomate?: () => void;
}

// eslint-disable-next-line max-statements, max-lines-per-function -- Keypad component with multiple digit handlers and animation values
export const TransactionKeypad = (props: Props) => {
    const {
        variant,
        onDigit,
        onDecimal,
        onBackspace,
        onLongBackspace,
        onConfirm,
        onCancel,
        isConfirmDisabled,
        confirmTestID,
        showAutomateButton = false,
        onAutomate
    } = props;

    const confirmFlex = useSharedValue(CONFIRM_FLEX_DEFAULT);
    const gearFlex = useSharedValue(0);
    const gearRotation = useSharedValue(0);

    useEffect(() => {
        if (showAutomateButton) {
            confirmFlex.value = withTiming(CONFIRM_FLEX_SPLIT, { duration: FLEX_ANIMATION_DURATION });
            gearFlex.value = withTiming(GEAR_FLEX, { duration: FLEX_ANIMATION_DURATION });
            gearRotation.value = withTiming(FULL_ROTATION, { duration: GEAR_SPIN_DURATION });
        } else {
            confirmFlex.value = withTiming(CONFIRM_FLEX_DEFAULT, { duration: FLEX_ANIMATION_DURATION });
            gearFlex.value = withTiming(0, { duration: FLEX_ANIMATION_DURATION });
            gearRotation.value = 0;
        }
    }, [showAutomateButton, confirmFlex, gearFlex, gearRotation]);

    const confirmAnimatedStyle = useAnimatedStyle(() => ({
        flex: confirmFlex.value
    }));

    const gearAnimatedStyle = useAnimatedStyle(() => ({
        flex: gearFlex.value
    }));

    const gearIconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${gearRotation.value}deg` }]
    }));

    const handleDigit1 = () => void onDigit('1');
    const handleDigit2 = () => void onDigit('2');
    const handleDigit3 = () => void onDigit('3');
    const handleDigit4 = () => void onDigit('4');
    const handleDigit5 = () => void onDigit('5');
    const handleDigit6 = () => void onDigit('6');
    const handleDigit7 = () => void onDigit('7');
    const handleDigit8 = () => void onDigit('8');
    const handleDigit9 = () => void onDigit('9');
    const handleDigit0 = () => void onDigit('0');

    return (
        <Animated.View entering={FadeInUp.delay(100).duration(250)} className="flex-1 pb-lg">
            <View className="flex-1 gap-md">
                <View className="flex-1 gap-md">
                    <View className="flex-1 flex-row gap-md">
                        <TransactionKeypadButton value="1" onPress={handleDigit1} />
                        <TransactionKeypadButton value="2" onPress={handleDigit2} />
                        <TransactionKeypadButton value="3" onPress={handleDigit3} />
                    </View>
                    <View className="flex-1 flex-row gap-md">
                        <TransactionKeypadButton value="4" onPress={handleDigit4} />
                        <TransactionKeypadButton value="5" onPress={handleDigit5} />
                        <TransactionKeypadButton value="6" onPress={handleDigit6} />
                    </View>
                    <View className="flex-1 flex-row gap-md">
                        <TransactionKeypadButton value="7" onPress={handleDigit7} />
                        <TransactionKeypadButton value="8" onPress={handleDigit8} />
                        <TransactionKeypadButton value="9" onPress={handleDigit9} />
                    </View>
                    <View className="flex-1 flex-row gap-md">
                        <TransactionKeypadButton value="." onPress={onDecimal} />
                        <TransactionKeypadButton value="0" onPress={handleDigit0} />
                        <TransactionKeypadButton
                            icon={UserIconNameEnum.Delete}
                            variant="action"
                            onPress={onBackspace}
                            onLongPress={onLongBackspace}
                        />
                    </View>
                </View>

                <View className="flex-row gap-md">
                    <TransactionKeypadButton icon={UserIconNameEnum.X} variant="cancel" onPress={onCancel} />
                    <Animated.View style={confirmAnimatedStyle}>
                        <TransactionKeypadButton
                            testID={confirmTestID}
                            icon={UserIconNameEnum.CircleCheck}
                            variant="confirm"
                            colorVariant={variant}
                            onPress={onConfirm}
                            disabled={isConfirmDisabled}
                        />
                    </Animated.View>
                    {showAutomateButton ? (
                        <Animated.View entering={FadeIn.duration(FLEX_ANIMATION_DURATION)} style={gearAnimatedStyle}>
                            <TransactionKeypadButton
                                icon={UserIconNameEnum.Cog}
                                iconAnimatedStyle={gearIconAnimatedStyle}
                                variant="cancel"
                                onPress={onAutomate ?? onConfirm}
                            />
                        </Animated.View>
                    ) : null}
                </View>
            </View>
        </Animated.View>
    );
};
