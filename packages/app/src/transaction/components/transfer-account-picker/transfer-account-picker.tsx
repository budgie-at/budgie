import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
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

export const TransferAccountPicker = ({ label, placeholder, account, animatedStyle, testID, selectedTestID, onPress }: Props) => {
    const hasAccount = isDefined(account);
    const pressableProps = { accessibilityLabel: `${label}: ${account?.title ?? placeholder}` };
    const icon = hasAccount ? account.icon : UserIconNameEnum.Wallet;
    const isInactiveAccount = hasAccount && !account.isActive;

    return (
        <Animated.View style={animatedStyle}>
            <TransactionFormRow
                left={
                    <AccountInactiveIcon isInactive={isInactiveAccount} size={36}>
                        <GroupedListIcon icon={icon} />
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
