import { TransactionTypeEnum, UserIconNameEnum, isExpenseTransaction, isIncomeTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useConvertToRefundModal } from '../../context/convert-to-refund-modal.context';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionListConvertMenuItem } from '../transaction-list-convert-menu-item/transaction-list-convert-menu-item';

import { TransactionListContextMenuSelector } from './transaction-list-context-menu.selector';

import type { TransactionListContextMenuPropsInterface } from '../../interface/transaction-list-context-menu-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

const isConvertibleTransaction = (transaction: TransactionWithRelationsEntityInterface): boolean =>
    isExpenseTransaction(transaction) || isIncomeTransaction(transaction);

const getConvertTransactionType = (
    transaction: TransactionWithRelationsEntityInterface
): TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME =>
    isExpenseTransaction(transaction) ? TransactionTypeEnum.EXPENSE : TransactionTypeEnum.INCOME;

const openTransactionListTransferConversion = (
    transaction: TransactionWithRelationsEntityInterface,
    openConvertToTransfer: ReturnType<typeof useConvertToTransferModal>[0]
) => {
    const [sourceEntry] = transaction.entries;

    openConvertToTransfer({
        transactionId: transaction.id,
        transactionType: getConvertTransactionType(transaction),
        excludeAccountId: sourceEntry.accountId,
        sourceAmount: convertFromMicroUnits(sourceEntry.amount),
        sourceInstrumentId: sourceEntry.account.instrumentId,
        sourceCode: sourceEntry.account.instrument.code,
        skipPostConvertNavigation: true
    }).catch(emptyFn);
};

// eslint-disable-next-line max-statements -- Context menu component with deferred action pattern and multiple handlers
export const TransactionListContextMenu = ({
    transaction,
    anchor,
    isOpen,
    onClose,
    onCloseComplete
}: TransactionListContextMenuPropsInterface) => {
    const { t } = useLingui();
    const router = useRouter();
    const deleteTransaction = useDeleteTransaction();
    const [openConvertToRefund] = useConvertToRefundModal();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const pendingActionRef = useRef<EmptyFn | null>(null);
    const transactionId = transaction?.id ?? 0;
    const revertConsolidation = useRevertConsolidation(transactionId);

    if (!isDefined(transaction)) {
        return null;
    }

    const isConsolidated = isDefined(transaction.consolidationType);
    const isRefunded = isDefined(transaction.consolidationParentTransactionId);
    const canConvert = !isConsolidated && isConvertibleTransaction(transaction);
    const canConvertToRefund = !isConsolidated && !isRefunded && isIncomeTransaction(transaction);
    const actionLabel = isConsolidated ? t`Revert` : t`Delete Transaction`;
    const actionIcon = isConsolidated ? UserIconNameEnum.Undo2 : UserIconNameEnum.Trash2;
    const actionTestID = isConsolidated ? TransactionListContextMenuSelector.RevertButton : TransactionListContextMenuSelector.DeleteButton;

    const closeMenu = (afterClose?: EmptyFn) => {
        pendingActionRef.current = afterClose ?? null;
        onClose();
    };

    const handleDismiss = () => {
        pendingActionRef.current = null;
        onClose();
    };

    const handleCloseComplete = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }

        onCloseComplete();
    };

    const handleEditPress = () => {
        closeMenu(() => void router.push(getTransactionHref(transaction)));
    };

    const handleActionPress = () => {
        if (isConsolidated) {
            closeMenu(revertConsolidation);

            return;
        }

        closeMenu(() => {
            deleteTransaction(transaction.id, { isConsolidated }).catch(emptyFn);
        });
    };

    const handleConvertPress = () => {
        closeMenu(() => {
            openTransactionListTransferConversion(transaction, openConvertToTransfer);
        });
    };

    const handleConvertToRefundPress = () => {
        closeMenu(() => {
            openConvertToRefund({ refundIncomeTransactionId: transaction.id }).catch(emptyFn);
        });
    };

    return (
        <PopoverMenu isOpen={isOpen} onClose={handleDismiss} onCloseComplete={handleCloseComplete} anchor={anchor}>
            <View className="py-sm">
                <PopoverMenuItem
                    icon={UserIconNameEnum.Pencil}
                    label={t`Edit Transaction`}
                    onPress={handleEditPress}
                    testID={TransactionListContextMenuSelector.EditButton}
                />
                <TransactionListConvertMenuItem isVisible={canConvertToRefund} isRefund onConvert={handleConvertToRefundPress} />
                <TransactionListConvertMenuItem isVisible={canConvert} onConvert={handleConvertPress} />
                <PopoverMenuItem
                    icon={actionIcon}
                    label={actionLabel}
                    onPress={handleActionPress}
                    variant="destructive"
                    testID={actionTestID}
                />
            </View>
        </PopoverMenu>
    );
};
