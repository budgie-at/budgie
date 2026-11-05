import { AccountTypeEnum, TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode, RefObject, useImperativeHandle, useState } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import { LayoutChangeEvent, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { TransactionFormRowPlaceholderToneEnum } from '../../enum/transaction-form-row-placeholder-tone.enum';
import { useTransferAccounts } from '../../hook/use-transfer-accounts.hook';
import { QuickFormFieldError } from '../quick-form-field-error/quick-form-field-error';
import { TransactionFormRowPlaceholder } from '../transaction-form-row-placeholder/transaction-form-row-placeholder';
import { TransferAccountPicker } from '../transfer-account-picker/transfer-account-picker';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';
import { TransferSwapButton } from '../transfer-swap-button/transfer-swap-button';

export interface TransactionTransferAccountsRowRef {
    shakeFrom: () => void;
    shakeTo: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionTransferAccountsRowRef | null>;
    readonly children?: ReactNode;
}

const TRANSFER_ACCOUNT_FIELDS = ['fromAccountId', 'toAccountId'] as const;

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const TransactionTransferAccountsRow = ({ ref, children }: Props) => {
    const { t } = useLingui();
    const [fromRowHeight, setFromRowHeight] = useState(0);
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const { errors } = useFormState({ control });
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
    const missingPlaceholder = (
        <TransactionFormRowPlaceholder tone={TransactionFormRowPlaceholderToneEnum.DESTRUCTIVE}>{t`Choose`}</TransactionFormRowPlaceholder>
    );
    const fromPlaceholder = isDefined(errors.root?.['fromAccountId']) ? missingPlaceholder : t`Choose`;
    const toPlaceholder = isDefined(errors.root?.['toAccountId']) ? missingPlaceholder : t`Choose`;

    return (
        <View>
            <GroupedListSection footer={<QuickFormFieldError fields={TRANSFER_ACCOUNT_FIELDS} />}>
                <View onLayout={handleFromLayout}>
                    <TransferAccountPicker
                        label={t({ message: 'From', context: 'transfer account' })}
                        account={fromAccount}
                        placeholder={fromPlaceholder}
                        animatedStyle={fromAnimatedStyle}
                        testID={TransferQuickFormSelector.FromAccount}
                        selectedTestID={fromAccountSelectedTestID}
                        onPress={handleFromPress}
                    />
                </View>
                <TransferAccountPicker
                    label={t({ message: 'To', context: 'transfer account' })}
                    account={toAccount}
                    placeholder={toPlaceholder}
                    animatedStyle={toAnimatedStyle}
                    testID={TransferQuickFormSelector.ToAccount}
                    selectedTestID={toAccountSelectedTestID}
                    onPress={handleToPress}
                />
                {children}
            </GroupedListSection>
            <TransferSwapButton dividerOffset={fromRowHeight} isEnabled={canSwap} onPress={handleSwap} />
        </View>
    );
};
