import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { View, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { AccountInactiveIcon } from '../../../account/component/account-inactive-icon/account-inactive-icon';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';

interface Props {
    readonly label: string;
    readonly placeholder: string;
    readonly account: AccountWithInstrumentEntityInterface | null | undefined;
    readonly animatedStyle?: AnimatedStyle<ViewStyle>;
    readonly testID?: string;
    readonly selectedTestID?: string;
    readonly onPress: () => void;
}

const ROW_STYLE = { minHeight: 64 };

export const TransferAccountPicker = ({ label, placeholder, account, animatedStyle, testID, selectedTestID, onPress }: Props) => {
    const hasAccount = isDefined(account);
    const pressableProps = { accessibilityLabel: `${label}: ${account?.title ?? placeholder}`, style: ROW_STYLE };
    const icon = hasAccount ? account.icon : UserIconNameEnum.Wallet;
    const isInactiveAccount = hasAccount && !account.isActive;

    return (
        <Animated.View style={animatedStyle}>
            <TransactionFormRow
                left={
                    <AccountInactiveIcon isInactive={isInactiveAccount} size={36}>
                        <View className="h-[36px] w-[36px] items-center justify-center">
                            <Icon icon={icon} size={22} className="text-secondary-foreground" />
                        </View>
                    </AccountInactiveIcon>
                }
                label={label}
                value={account?.title}
                placeholder={placeholder}
                valueTestID={testIDProps(hasAccount && selectedTestID).testID}
                onPress={onPress}
                testID={testID}
                pressableProps={pressableProps}
            />
        </Animated.View>
    );
};
