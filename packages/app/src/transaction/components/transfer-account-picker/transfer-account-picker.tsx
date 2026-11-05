import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { ReactElement } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { isDefined, isString } from '@rnw-community/shared';

import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { AccountInactiveIcon } from '../../../account/component/account-inactive-icon/account-inactive-icon';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';

interface Props {
    readonly label: string;
    readonly placeholder: string | ReactElement;
    readonly account: AccountWithInstrumentEntityInterface | null | undefined;
    readonly animatedStyle?: AnimatedStyle<ViewStyle>;
    readonly testID?: string;
    readonly selectedTestID?: string;
    readonly onPress: () => void;
}

const ROW_STYLE = { minHeight: 60 };

export const TransferAccountPicker = ({ label, placeholder, account, animatedStyle, testID, selectedTestID, onPress }: Props) => {
    const hasAccount = isDefined(account);
    const accessibilityPlaceholder = isString(placeholder) ? placeholder : t`Choose`;
    const pressableProps = { accessibilityLabel: `${label}: ${account?.title ?? accessibilityPlaceholder}`, style: ROW_STYLE };
    const icon = hasAccount ? account.icon : UserIconNameEnum.Wallet;
    const isInactiveAccount = hasAccount && !account.isActive;

    return (
        <Animated.View style={animatedStyle}>
            <TransactionFormRow
                left={
                    <AccountInactiveIcon isInactive={isInactiveAccount} size={30}>
                        <TransactionFormIcon icon={icon} />
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
