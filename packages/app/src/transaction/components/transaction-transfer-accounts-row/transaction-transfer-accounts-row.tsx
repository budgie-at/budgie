import { AccountTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { LayoutChangeEvent, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { TransferAccountPicker } from '../transfer-account-picker/transfer-account-picker';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';
import { TransferSwapButton } from '../transfer-swap-button/transfer-swap-button';

export interface TransactionTransferAccountsRowRef {
    shakeFrom: () => void;
    shakeTo: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionTransferAccountsRowRef | null>;
}

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const TransactionTransferAccountsRow = ({ ref }: Props) => {
    const { t } = useLingui();
    const [fromRowHeight, setFromRowHeight] = useState(0);
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

    const handleFromLayout = (event: LayoutChangeEvent) => void setFromRowHeight(event.nativeEvent.layout.height);
    const canSwap = isDefined(fromAccountId) && isDefined(toAccountId);

    return (
        <View>
            <GroupedListSection>
                <View onLayout={handleFromLayout}>
                    <TransferAccountPicker
                        label={t({ message: 'From', context: 'transfer account' })}
                        account={fromAccount}
                        placeholder={t`Choose`}
                        animatedStyle={fromAnimatedStyle}
                        testID={TransferQuickFormSelector.FromAccount}
                        selectedTestID={fromAccountSelectedTestID}
                        onPress={handleFromPress}
                    />
                </View>
                <TransferAccountPicker
                    label={t({ message: 'To', context: 'transfer account' })}
                    account={toAccount}
                    placeholder={t`Choose`}
                    animatedStyle={toAnimatedStyle}
                    testID={TransferQuickFormSelector.ToAccount}
                    selectedTestID={toAccountSelectedTestID}
                    onPress={handleToPress}
                />
            </GroupedListSection>
            <TransferSwapButton dividerOffset={fromRowHeight} isEnabled={canSwap} onPress={handleSwap} />
        </View>
    );
};
