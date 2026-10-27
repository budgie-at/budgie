import { ImpactFeedbackStyle } from 'expo-haptics';
import { RefObject, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { TransactionListContextMenuContext } from '../../context/transaction-list-context-menu.context';
import { useTransactionListContextMenuClose } from '../../hook/use-transaction-list-context-menu-close.hook';
import { TransactionListAttachDebtMenuItem } from '../transaction-list-attach-debt-menu-item/transaction-list-attach-debt-menu-item';
import { TransactionListConvertToInstallmentMenuItem } from '../transaction-list-convert-to-installment-menu-item/transaction-list-convert-to-installment-menu-item';
import { TransactionListConvertToRefundMenuItem } from '../transaction-list-convert-to-refund-menu-item/transaction-list-convert-to-refund-menu-item';
import { TransactionListConvertToTransferMenuItem } from '../transaction-list-convert-to-transfer-menu-item/transaction-list-convert-to-transfer-menu-item';
import { TransactionListDeleteMenuItem } from '../transaction-list-delete-menu-item/transaction-list-delete-menu-item';
import { TransactionListEditMenuItem } from '../transaction-list-edit-menu-item/transaction-list-edit-menu-item';
import { TransactionListRevertMenuItem } from '../transaction-list-revert-menu-item/transaction-list-revert-menu-item';
import { TransactionListStartDepositMenuItem } from '../transaction-list-start-deposit-menu-item/transaction-list-start-deposit-menu-item';

import type { TransactionListContextMenuRefInterface } from '../../interface/transaction-list-context-menu-ref.interface';
import type { TransactionMenuStateInterface } from '../../interface/transaction-menu-state.interface';

interface Props {
    readonly ref: RefObject<TransactionListContextMenuRefInterface | null>;
}

export const TransactionListContextMenu = ({ ref }: Props) => {
    const [, hapticImpact] = useVibration();
    const [isOpen, setIsOpen] = useState(false);
    const [menuState, setMenuState] = useState<TransactionMenuStateInterface | null>(null);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleMenuCloseComplete = () => {
        setMenuState(null);
    };

    const { closeMenu, handleCloseComplete } = useTransactionListContextMenuClose({
        isOpen,
        onClose: handleClose,
        onCloseComplete: handleMenuCloseComplete
    });

    useImperativeHandle(ref, () => ({
        open: (transaction, anchor) => {
            hapticImpact(ImpactFeedbackStyle.Medium);
            setMenuState({ transaction, anchor });
            setIsOpen(true);
        }
    }));

    if (!isDefined(menuState)) {
        return null;
    }

    const contextValue = { transaction: menuState.transaction, closeMenu };

    return (
        <PopoverMenu isOpen={isOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={menuState.anchor}>
            <TransactionListContextMenuContext.Provider value={contextValue}>
                <View className="py-sm">
                    <TransactionListEditMenuItem />
                    <TransactionListConvertToRefundMenuItem />
                    <TransactionListConvertToTransferMenuItem />
                    <TransactionListStartDepositMenuItem />
                    <TransactionListConvertToInstallmentMenuItem />
                    <TransactionListAttachDebtMenuItem />
                    <TransactionListDeleteMenuItem />
                    <TransactionListRevertMenuItem />
                </View>
            </TransactionListContextMenuContext.Provider>
        </PopoverMenu>
    );
};
