import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useAnchoredMorphOriginPress } from '../../../@generic/hook/use-anchored-morph-origin-press.hook';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { AccountInactiveIcon } from '../../../account/component/account-inactive-icon/account-inactive-icon';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { getAccountDisplayTitle } from '../../../account/utils/get-account-display-title.util';
import { useTransactionAccountSelector } from '../../hook/use-transaction-account-selector.hook';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';

export interface TransactionAccountRowRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionAccountRowRef | null>;
    readonly fieldName: 'fromAccountId' | 'toAccountId';
    readonly label?: string;
    readonly testID?: string;
    readonly edge?: RoundedEdgeEnum;
}

export const TransactionAccountRow = ({ ref, fieldName, label, testID, edge = RoundedEdgeEnum.TOP }: Props) => {
    const { t } = useLingui();
    const { accountId, handleOpenAccountSelector } = useTransactionAccountSelector(fieldName);
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const { account } = useGetAccountByIdQuery(accountId ?? 0);

    const displayLabel = label ?? t`Account`;
    const isInactiveAccount = isDefined(account) && !account.isActive;
    const selectedAccountTestID = isDefined(account?.title) ? SimpleQuickFormSelector.SelectedAccount(account.title) : null;
    const ghostPressableProps = { onPress: emptyFn };
    const accountTitle = isDefined(account) ? getAccountDisplayTitle(account) : void 0;
    const accountIcon = (
        <AccountInactiveIcon isInactive={isInactiveAccount} size={30}>
            <TransactionFormIcon icon={account?.icon ?? UserIconNameEnum.Wallet} />
        </AccountInactiveIcon>
    );

    const ghost = (
        <TransactionFormRow
            left={accountIcon}
            label={displayLabel}
            value={accountTitle}
            placeholder={t`Choose`}
            pressableProps={ghostPressableProps}
        />
    );
    const { ref: measureRef, handlePress } = useAnchoredMorphOriginPress(edge, ghost, handleOpenAccountSelector);
    const pressableProps = {
        onPress: handlePress,
        accessibilityLabel: `${displayLabel}: ${isDefined(account) ? getAccountDisplayTitle(account) : t`Choose`}`
    };

    return (
        <Animated.View style={shakeStyle}>
            <View ref={measureRef} collapsable={false}>
                <TransactionFormRow
                    left={accountIcon}
                    label={displayLabel}
                    value={accountTitle}
                    placeholder={t`Choose`}
                    valueProps={testIDProps(selectedAccountTestID)}
                    testID={testID}
                    pressableProps={pressableProps}
                />
            </View>
        </Animated.View>
    );
};
