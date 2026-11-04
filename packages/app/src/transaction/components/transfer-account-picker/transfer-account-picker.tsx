import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Text, View, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
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
        <Animated.View style={animatedStyle} className="flex-1">
            <HapticPressable
                className="min-h-[56px] flex-row items-center gap-sm rounded-2xl border-hairline border-surface-separator bg-transaction-detail-row py-md px-md dark:border-transparent"
                onPress={onPress}
                testID={testID}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
            >
                <AccountInactiveIcon isInactive={isInactiveAccount} size={28}>
                    <CircleIcon icon={icon} variant="ghost" border={false} size={28} iconSize={14} radius={8} />
                </AccountInactiveIcon>

                <View className="flex-1 justify-center">
                    <View className="flex-row items-center gap-xxs">
                        <Text className="shrink text-[13px] leading-[18px] text-secondary-foreground" numberOfLines={1}>
                            {label}
                        </Text>
                        <Icon icon={UserIconNameEnum.ChevronDown} size={12} className="text-secondary-foreground" />
                    </View>
                    <Text
                        className={cn('text-[15px] leading-[20px] font-medium', titleClassName)}
                        numberOfLines={1}
                        {...testIDProps(hasAccount && selectedTestID)}
                    >
                        {account?.title ?? placeholder}
                    </Text>
                </View>
            </HapticPressable>
        </Animated.View>
    );
};
