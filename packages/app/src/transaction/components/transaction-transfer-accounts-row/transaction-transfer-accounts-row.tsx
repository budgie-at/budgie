import { AccountTypeEnum, TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { LayoutChangeEvent, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
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

const SWAP_SIZE = 36;
const SWAP_HIT_SLOP = 4;

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
    const swapStyle = { top: fromRowHeight - SWAP_SIZE / 2, opacity: fromRowHeight > 0 ? 1 : 0 };

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
            <HapticPressable
                className="absolute left-[16px] h-[36px] w-[36px] items-center justify-center rounded-full border-[3px] border-grouped-surface-row bg-surface-disc"
                style={swapStyle}
                hitSlop={SWAP_HIT_SLOP}
                onPress={handleSwap}
                testID={TransferQuickFormSelector.SwapAccounts}
                accessibilityLabel={t`Swap accounts`}
                accessibilityRole="button"
            >
                <Icon icon={UserIconNameEnum.ArrowUpDown} size={16} className="text-primary" />
            </HapticPressable>
        </View>
    );
};
