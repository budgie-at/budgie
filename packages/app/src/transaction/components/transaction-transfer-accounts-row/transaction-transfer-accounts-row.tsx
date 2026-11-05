import { AccountTypeEnum, TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle } from 'react';
import { useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { TransferAccountPicker } from '../transfer-account-picker/transfer-account-picker';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

export interface TransactionTransferAccountsRowRef {
    shakeFrom: () => void;
    shakeTo: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionTransferAccountsRowRef | null>;
}

export const TransactionTransferAccountsRow = ({ ref }: Props) => {
    const { t } = useLingui();
    const { setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const { shake: shakeFrom, animatedStyle: fromAnimatedStyle } = useShakeAnimation();
    const { shake: shakeTo, animatedStyle: toAnimatedStyle } = useShakeAnimation();
    const { fromAccountId, toAccountId, fromAccount, toAccount } = useTransferAccounts();

    useImperativeHandle(ref, () => ({ shakeFrom, shakeTo }));

    const fromAccountSelectedTestID = isDefined(fromAccount) ? TransferQuickFormSelector.SelectedFromAccount(fromAccount.title) : void 0;
    const toAccountSelectedTestID = isDefined(toAccount) ? TransferQuickFormSelector.SelectedToAccount(toAccount.title) : void 0;

    const handleFromPress = () => {
        openAccountSelector(
            {
                initialAccountId: fromAccountId,
                excludeAccountId: toAccountId,
                excludeAccountTypes: [AccountTypeEnum.DEBT],
                onlyActive: false
            },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    setValue('fromAccountId', selectedAccountId);
                }
            }
        );
    };

    const handleToPress = () => {
        openAccountSelector(
            {
                initialAccountId: toAccountId,
                excludeAccountId: fromAccountId,
                excludeAccountTypes: [AccountTypeEnum.DEBT],
                onlyActive: false
            },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    setValue('toAccountId', selectedAccountId);
                }
            }
        );
    };

    const handleSwap = () => {
        setValue('fromAccountId', toAccountId);
        setValue('toAccountId', fromAccountId);
    };

    return (
        <View className="flex-row items-center overflow-hidden rounded-3xl bg-grouped-surface-row pr-[4px]">
            <View className="-mt-px flex-1">
                <TransferAccountPicker
                    label={t({ message: 'From', context: 'transfer account' })}
                    account={fromAccount}
                    placeholder={t`Select account`}
                    animatedStyle={fromAnimatedStyle}
                    testID={TransferQuickFormSelector.FromAccount}
                    selectedTestID={fromAccountSelectedTestID}
                    onPress={handleFromPress}
                />

                <TransferAccountPicker
                    label={t({ message: 'To', context: 'transfer account' })}
                    account={toAccount}
                    placeholder={t`Select account`}
                    animatedStyle={toAnimatedStyle}
                    testID={TransferQuickFormSelector.ToAccount}
                    selectedTestID={toAccountSelectedTestID}
                    onPress={handleToPress}
                />
            </View>
            <HapticPressable
                className="h-[44px] w-[44px] items-center justify-center self-center"
                onPress={handleSwap}
                testID={TransferQuickFormSelector.SwapAccounts}
                accessibilityLabel={t`Swap accounts`}
                accessibilityRole="button"
            >
                <GroupedListIcon icon={UserIconNameEnum.ArrowUpDown} />
            </HapticPressable>
        </View>
    );
};
