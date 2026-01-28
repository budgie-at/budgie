import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly label: string;
    readonly selectLabel: string;
    readonly account: AccountWithInstrumentEntityInterface | null | undefined;
    readonly variant: ColorPaletteVariant;
    readonly animatedStyle?: StyleProp<ViewStyle>;
    readonly onPress: () => void;
}

export const TransferAccountPicker = ({ label, selectLabel, account, variant, animatedStyle, onPress }: Props) => {
    const accessibilityLabel = `${label}: ${account?.title ?? selectLabel}`;
    const icon = isDefined(account) ? account.icon : UserIconNameEnum.Wallet;

    return (
        <Animated.View style={animatedStyle} className="flex-1">
            <HapticPressable
                className="flex-row items-center px-md py-md gap-sm bg-secondary-background rounded-2xl"
                onPress={onPress}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
            >
                <CircleIcon icon={icon} variant={variant} size={28} iconSize={14} radius={8} />

                <View className="flex-1">
                    <Text className="text-2xs text-secondary-foreground uppercase">{label}</Text>
                    <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                        {account?.title ?? selectLabel}
                    </Text>
                </View>

                <Icon icon={UserIconNameEnum.ChevronDown} size={14} className="text-secondary-foreground" />
            </HapticPressable>
        </Animated.View>
    );
};
