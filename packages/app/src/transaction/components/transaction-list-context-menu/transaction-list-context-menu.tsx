import { AccountTypeEnum, TransactionTypeEnum, UserIconNameEnum, isExpenseTransaction, isIncomeTransaction } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useDeferredMenuClose } from '../../../@generic/hook/use-deferred-menu-close.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useConvertToRefundModal } from '../../context/convert-to-refund-modal.context';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { transactionDebtSettlementService } from '../../service/transaction-debt-settlement.service';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionDebtSettlementEntries } from '../../utils/get-transaction-debt-settlement-entries.util';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { TransactionListAttachDebtMenuItem } from '../transaction-list-attach-debt-menu-item/transaction-list-attach-debt-menu-item';
import { TransactionListConvertMenuItem } from '../transaction-list-convert-menu-item/transaction-list-convert-menu-item';

import { TransactionListContextMenuSelector } from './transaction-list-context-menu.selector';

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
    const [sourceEntry] = getTransactionCategoryEntries(transaction.entries);

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

const openTransactionListDebtSettlementAttachment = (
    transaction: TransactionWithRelationsEntityInterface,
    openAccountSelector: ReturnType<typeof useAccountSelectorModal>[0],
    options: Readonly<{
        readonly transactionAccountId: number;
        readonly emptyStateDescription: string;
        readonly attachErrorMessage: string;
    }>
) => {
    openAccountSelector({
        includeAccountTypes: [AccountTypeEnum.DEBT],
        excludeAccountId: options.transactionAccountId,
        emptyStateDescription: options.emptyStateDescription
    })
        .then(async debtAccountId => {
            if (isDefined(debtAccountId)) {
                await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId });
            }

            return null;
        })
        .catch(() => void Toast.show({ type: 'error', text1: options.attachErrorMessage }));
};

// eslint-disable-next-line max-statements -- Context menu component with deferred action pattern and multiple handlers
export const TransactionListContextMenu = ({ transaction, anchor, isOpen, onClose, onCloseComplete }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const deleteTransaction = useDeleteTransaction();
    const [openAccountSelector] = useAccountSelectorModal();
    const [openConvertToRefund] = useConvertToRefundModal();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const transactionId = transaction?.id ?? 0;
    const revertConsolidation = useRevertConsolidation(transactionId);
    const { closeMenu, handleCloseComplete: handleDeferredCloseComplete } = useDeferredMenuClose({ isOpen, onClose });

    if (!isDefined(transaction)) {
        return null;
    }

    const isConsolidated = isDefined(transaction.consolidationType);
    const isRefunded = isDefined(transaction.consolidationParentTransactionId);
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const transactionAccountId = categoryEntries.at(0)?.accountId ?? 0;
    const hasDebtSettlement = isDefined(getTransactionDebtSettlementEntries(transaction.entries).at(0));
    const canConvert = !isConsolidated && isConvertibleTransaction(transaction) && categoryEntries.length === 1;
    const canAttachDebtSettlement =
        !isConsolidated && !isRefunded && isConvertibleTransaction(transaction) && categoryEntries.length === 1 && !hasDebtSettlement;
    const canConvertToRefund = !isConsolidated && !isRefunded && isIncomeTransaction(transaction);
    const actionLabel = isConsolidated ? t`Revert` : t`Delete Transaction`;
    const actionIcon = isConsolidated ? UserIconNameEnum.Undo2 : UserIconNameEnum.Trash2;
    const actionTestID = isConsolidated ? TransactionListContextMenuSelector.RevertButton : TransactionListContextMenuSelector.DeleteButton;
    const debtAttachmentEmptyStateDescription = t`Create a debt account first.`;
    const debtAttachmentErrorMessage = t`Could not attach debt`;

    const handleCloseComplete = () => {
        handleDeferredCloseComplete();
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

    const handleAttachDebtSettlementPress = () => {
        closeMenu(() => {
            openTransactionListDebtSettlementAttachment(transaction, openAccountSelector, {
                transactionAccountId,
                emptyStateDescription: debtAttachmentEmptyStateDescription,
                attachErrorMessage: debtAttachmentErrorMessage
            });
        });
    };

    const handleConvertToRefundPress = () => {
        closeMenu(() => {
            openConvertToRefund({ refundIncomeTransactionId: transaction.id }).catch(emptyFn);
        });
    };

    return (
        <PopoverMenu isOpen={isOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
            <View className="py-sm">
                <PopoverMenuItem
                    icon={UserIconNameEnum.Pencil}
                    label={t`Edit Transaction`}
                    onPress={handleEditPress}
                    testID={TransactionListContextMenuSelector.EditButton}
                />
                <TransactionListConvertMenuItem isVisible={canConvertToRefund} isRefund onConvert={handleConvertToRefundPress} />
                <TransactionListConvertMenuItem isVisible={canConvert} onConvert={handleConvertPress} />
                <TransactionListAttachDebtMenuItem isVisible={canAttachDebtSettlement} onAttach={handleAttachDebtSettlementPress} />
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
