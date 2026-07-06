import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { TransactionListContextMenuContext } from '../../context/transaction-list-context-menu.context';
import { useTransactionListContextMenuClose } from '../../hook/use-transaction-list-context-menu-close.hook';
import { TransactionListAttachDebtMenuItem } from '../transaction-list-attach-debt-menu-item/transaction-list-attach-debt-menu-item';
import { TransactionListConvertToRefundMenuItem } from '../transaction-list-convert-to-refund-menu-item/transaction-list-convert-to-refund-menu-item';
import { TransactionListConvertToTransferMenuItem } from '../transaction-list-convert-to-transfer-menu-item/transaction-list-convert-to-transfer-menu-item';
import { TransactionListDeleteMenuItem } from '../transaction-list-delete-menu-item/transaction-list-delete-menu-item';
import { TransactionListEditMenuItem } from '../transaction-list-edit-menu-item/transaction-list-edit-menu-item';
import { TransactionListRevertMenuItem } from '../transaction-list-revert-menu-item/transaction-list-revert-menu-item';

import type { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface | null;
    readonly anchor?: PopoverMenuAnchor;
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
    readonly onCloseComplete: EmptyFn;
}

export const TransactionListContextMenu = ({ transaction, anchor, isOpen, onClose, onCloseComplete }: Props) => {
    const { closeMenu, handleCloseComplete } = useTransactionListContextMenuClose({ isOpen, onClose, onCloseComplete });

    if (!isDefined(transaction)) {
        return null;
    }

    const contextValue = { transaction, closeMenu };

    return (
        <PopoverMenu isOpen={isOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
            <TransactionListContextMenuContext.Provider value={contextValue}>
                <View className="py-sm">
                    <TransactionListEditMenuItem />
                    <TransactionListConvertToRefundMenuItem />
                    <TransactionListConvertToTransferMenuItem />
                    <TransactionListAttachDebtMenuItem />
                    <TransactionListDeleteMenuItem />
                    <TransactionListRevertMenuItem />
                </View>
            </TransactionListContextMenuContext.Provider>
        </PopoverMenu>
    );
};
