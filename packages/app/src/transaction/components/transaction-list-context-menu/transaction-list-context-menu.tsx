import { ImpactFeedbackStyle } from 'expo-haptics';
import { RefObject, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { ActionsMenuContext } from '../../../@generic/context/actions-menu.context';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
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

    const pendingActionRef = useRef<EmptyFn | null>(null);
    const closeMenu = (afterClose?: EmptyFn) => {
        if (!isOpen) {
            return;
        }

        pendingActionRef.current = afterClose ?? null;
        setIsOpen(false);
    };
    const handleCloseComplete = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }

        setMenuState(null);
    };

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

    const { transaction } = menuState;

    return (
        <PopoverMenu isOpen={isOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={menuState.anchor}>
            <ActionsMenuContext value={closeMenu}>
                <View className="py-sm">
                    <TransactionListEditMenuItem transaction={transaction} />
                    <TransactionListConvertToRefundMenuItem transaction={transaction} />
                    <TransactionListConvertToTransferMenuItem transaction={transaction} />
                    <TransactionListStartDepositMenuItem transaction={transaction} />
                    <TransactionListConvertToInstallmentMenuItem transaction={transaction} />
                    <TransactionListAttachDebtMenuItem transaction={transaction} />
                    <TransactionListDeleteMenuItem transaction={transaction} />
                    <TransactionListRevertMenuItem transaction={transaction} />
                </View>
            </ActionsMenuContext>
        </PopoverMenu>
    );
};
