import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Text, View, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { AccountInactiveIcon } from '../../../account/component/account-inactive-icon/account-inactive-icon';

interface Props {
    readonly label: string;
    readonly placeholder: string;
    readonly account: AccountWithInstrumentEntityInterface | null | undefined;
    readonly animatedStyle?: AnimatedStyle<ViewStyle>;
    readonly testID?: string;
    readonly selectedTestID?: string;
    readonly onPress: () => void;
}

export const TransferAccountPicker = ({ label, placeholder, account, animatedStyle, testID, selectedTestID, onPress }: Props) => {
    const hasAccount = isDefined(account);
    const accessibilityLabel = `${label}: ${account?.title ?? placeholder}`;
    const icon = hasAccount ? account.icon : UserIconNameEnum.Wallet;
    const isInactiveAccount = hasAccount && !account.isActive;
    const titleClassName = hasAccount ? 'text-primary' : 'text-secondary-foreground';

    return (
        <Animated.View style={animatedStyle} className="self-stretch">
            <HapticPressable
                className="min-h-[56px] flex-row items-center gap-x-[12px] rounded-3xl border-hairline border-surface-separator bg-grouped-surface-row py-[8px] px-[16px] dark:border-transparent"
                onPress={onPress}
                testID={testID}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
            >
                <AccountInactiveIcon isInactive={isInactiveAccount} size={28}>
                    <View className="h-[28px] w-[28px] items-center justify-center">
                        <Icon icon={icon} size={20} className="text-secondary-foreground" />
                    </View>
                </AccountInactiveIcon>

                <View className="flex-1 justify-center">
                    <Text className="text-[13px] leading-[18px] text-secondary-foreground" numberOfLines={2}>
                        {label}
                    </Text>
                    <Text
                        className={cn('text-[16px] leading-[21px] font-medium', titleClassName)}
                        numberOfLines={2}
                        {...testIDProps(hasAccount && selectedTestID)}
                    >
                        {account?.title ?? placeholder}
                    </Text>
                </View>
                <View className="w-[20px] shrink-0 items-end">
                    <Icon icon={UserIconNameEnum.ChevronDown} size={16} className="text-secondary-foreground" />
                </View>
            </HapticPressable>
        </Animated.View>
    );
};
