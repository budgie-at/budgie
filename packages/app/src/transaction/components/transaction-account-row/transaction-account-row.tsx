import { AccountTypeEnum, TransactionCreateInputInterface, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { AccountInactiveIcon } from '../../../account/component/account-inactive-icon/account-inactive-icon';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldCaption } from '../transaction-field-caption/transaction-field-caption';

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
    const hasTestID = isNotEmptyString(testID);

    return (
        <View>
            <Animated.View style={shakeStyle}>
                <HapticPressable
                    className="relative min-h-[48px] flex-row items-center gap-xl bg-grouped-surface-row px-[16px] py-[10px]"
                    onPress={handlePress}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole="button"
                    accessible
                    collapsable={false}
                    nativeID={testID}
                    testID={testID}
                >
                    {hasTestID ? (
                        <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
                    ) : null}

                    <AccountInactiveIcon isInactive={isInactiveAccount} size={28}>
                        <View className="h-[28px] w-[28px] items-center justify-center">
                            <Icon icon={account?.icon ?? UserIconNameEnum.Wallet} size={20} className="text-secondary-foreground" />
                        </View>
                    </AccountInactiveIcon>

                    <View className="flex-1">
                        <TransactionFieldCaption
                            label={displayLabel}
                            value={account?.title}
                            placeholder={t`Select account`}
                            {...testIDProps(selectedAccountTestID)}
                        />
                    </View>

                    <View className="w-[20px] shrink-0 items-end">
                        <Icon icon={UserIconNameEnum.ChevronDown} size={16} className="text-secondary-foreground" />
                    </View>
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
