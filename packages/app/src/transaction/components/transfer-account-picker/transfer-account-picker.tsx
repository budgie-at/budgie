import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly label: string;
    readonly account: AccountWithInstrumentEntityInterface | null | undefined;
    readonly variant: ColorPaletteVariant;
    readonly animatedStyle?: StyleProp<ViewStyle>;
    readonly testID?: string;
    readonly selectedTestID?: string;
    readonly onPress: () => void;
}

const SPRING_CONFIG = { damping: 15, stiffness: 150 };
const TITLE_FONT_SIZE_SELECTED = 15;
const TITLE_FONT_SIZE_UNSELECTED = 14;

export const TransferAccountPicker = ({ label, account, variant, animatedStyle, testID, selectedTestID, onPress }: Props) => {
    const hasAccount = isDefined(account);
    const accessibilityLabel = `${label}: ${account?.title ?? label}`;
    const icon = hasAccount ? account.icon : UserIconNameEnum.Wallet;
    const titleFontSize = useSharedValue(hasAccount ? TITLE_FONT_SIZE_SELECTED : TITLE_FONT_SIZE_UNSELECTED);

    useEffect(() => {
        titleFontSize.set(withSpring(hasAccount ? TITLE_FONT_SIZE_SELECTED : TITLE_FONT_SIZE_UNSELECTED, SPRING_CONFIG));
    }, [hasAccount, titleFontSize]);

    const titleClassName = hasAccount ? 'font-medium text-primary' : 'font-medium text-secondary-foreground';
    const titleAnimatedStyle = useAnimatedStyle(() => ({
        fontSize: titleFontSize.value
    }));

    return (
        <Animated.View style={animatedStyle} className="flex-1">
            <HapticPressable
                className="flex-row items-center px-md py-md gap-sm bg-secondary-background rounded-2xl"
                onPress={onPress}
                testID={testID}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
            >
                <CircleIcon icon={icon} variant={variant} size={28} iconSize={14} radius={8} />

                <View className="flex-1 justify-center">
                    <Animated.Text
                        style={titleAnimatedStyle}
                        className={titleClassName}
                        numberOfLines={1}
                        {...(hasAccount && { testID: selectedTestID })}
                    >
                        {account?.title ?? label}
                    </Animated.Text>
                </View>

                <Icon icon={UserIconNameEnum.ChevronDown} size={14} className="text-secondary-foreground" />
            </HapticPressable>
        </Animated.View>
    );
};
