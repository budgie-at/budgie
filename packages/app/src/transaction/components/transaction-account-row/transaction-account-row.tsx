import { AccountTypeEnum, TransactionCreateInputInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { AccountInactiveIcon } from '../../../account/component/account-inactive-icon/account-inactive-icon';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';

export interface TransactionAccountRowRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionAccountRowRef | null>;
    readonly fieldName: 'fromAccountId' | 'toAccountId';
    readonly label?: string;
    readonly testID?: string;
}

export const TransactionAccountRow = ({ ref, fieldName, label, testID }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const accountId = useWatch({ control, name: fieldName });
    const transactionType = useWatch({ control, name: 'type' });
    const { account } = useGetAccountByIdQuery(accountId ?? 0);

    const handlePress = () => {
        const isExpenseSourceAccount = transactionType === TransactionTypeEnum.EXPENSE && fieldName === 'fromAccountId';
        openAccountSelector(
            {
                initialAccountId: accountId,
                onlyActive: false,
                ...(isExpenseSourceAccount && { excludeAccountTypes: [AccountTypeEnum.DEPOSIT] })
            },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    setValue(fieldName, selectedAccountId);
                }
            }
        );
    };

    const displayLabel = label ?? t`Account`;
    const accessibilityLabel = `${displayLabel}: ${account?.title ?? t`Select`}`;
    const isInactiveAccount = isDefined(account) && !account.isActive;
    const selectedAccountTestID = isDefined(account?.title) ? SimpleQuickFormSelector.SelectedAccount(account.title) : null;
    const pressableProps = { accessibilityLabel };

    return (
        <Animated.View style={shakeStyle}>
            <TransactionFormRow
                left={
                    <AccountInactiveIcon isInactive={isInactiveAccount} size={36}>
                        <GroupedListIcon icon={account?.icon ?? UserIconNameEnum.Wallet} />
                    </AccountInactiveIcon>
                }
                label={displayLabel}
                value={account?.title}
                placeholder={t`Choose`}
                valueTestID={testIDProps(selectedAccountTestID).testID}
                onPress={handlePress}
                testID={testID}
                pressableProps={pressableProps}
            />
        </Animated.View>
    );
};
