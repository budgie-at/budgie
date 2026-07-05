import {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum,
    isExpenseTransaction,
    isIncomeTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import Toast from 'react-native-toast-message';

import { emptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { PopoverMenu } from '../../../@generic/component/popover-menu/popover-menu';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { accountDebtOpeningService } from '../../../account/service/account-debt-opening.service';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useConvertToRefundModal } from '../../context/convert-to-refund-modal.context';
import { useConvertToTransferModal } from '../../context/convert-to-transfer-modal.context';
import { useDeleteTransaction } from '../../hook/use-delete-transaction.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { transactionDebtSettlementService } from '../../service/transaction-debt-settlement.service';
import { getTransactionCategoryEntries } from '../../utils/get-transaction-category-entries.util';
import { getTransactionDebtSettlementEntries } from '../../utils/get-transaction-debt-settlement-entries.util';
import { getTransactionHref } from '../../utils/get-transaction-href.util';

import { TransactionListContextMenuItems } from './transaction-list-context-menu-items';
import { TransactionListContextMenuSelector } from './transaction-list-context-menu.selector';

import type { PopoverMenuAnchor } from '../../../@generic/component/popover-menu/popover-menu';
import type { AccountSelectorCreateActionInterface } from '../../../account/interface/account-selector-create-action.interface';
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
        readonly createAction?: AccountSelectorCreateActionInterface | null;
    }>
) => {
    openAccountSelector({
        includeAccountTypes: [AccountTypeEnum.DEBT],
        excludeAccountId: options.transactionAccountId,
        emptyStateDescription: options.emptyStateDescription,
        showDebtTotal: true,
        ...(isDefined(options.createAction) && { createAction: options.createAction })
    })
        .then(async debtAccountId => {
            if (isDefined(debtAccountId)) {
                await transactionDebtSettlementService.attach({ transactionId: transaction.id, debtAccountId });
            }

            return null;
        })
        .catch(() => void Toast.show({ type: 'error', text1: options.attachErrorMessage }));
};

const getBorrowedDebtCreateAction = ({
    transaction,
    categoryEntry,
    debtAttachmentErrorMessage,
    formatDigits,
    t
}: {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly categoryEntry:
        | {
              readonly amount: number;
              readonly account: {
                  readonly instrumentId: number;
                  readonly instrument: {
                      readonly symbol: string;
                  };
              };
          }
        | undefined;
    readonly debtAttachmentErrorMessage: string;
    readonly formatDigits: ReturnType<typeof useFormatDigits>;
    readonly t: ReturnType<typeof useLingui>['t'];
}): AccountSelectorCreateActionInterface | null => {
    if (!isIncomeTransaction(transaction) || !isDefined(categoryEntry)) {
        return null;
    }

    const borrowedDebtTitle = isNotEmptyString(transaction.title) ? transaction.title : t`Borrowed`;

    return {
        title: t`New borrowed debt`,
        subtitle: `${t`Total borrowed`}: ${formatDigits(convertFromMicroUnits(categoryEntry.amount), categoryEntry.account.instrument.symbol)}`,
        errorMessage: debtAttachmentErrorMessage,
        onCreate: async () => {
            await accountDebtOpeningService.createBorrowedDebtFromIncome(
                {
                    title: borrowedDebtTitle,
                    iban: null,
                    icon: UserIconNameEnum.HandCoins,
                    instrumentId: categoryEntry.account.instrumentId,
                    type: AccountTypeEnum.DEBT,
                    debtType: AccountDebtTypeEnum.BORROW,
                    currentBalance: 0,
                    targetBalance: convertFromMicroUnits(categoryEntry.amount),
                    contactId: null,
                    deadline: null
                },
                transaction.id
            );
        }
    };
};

const useTransactionListContextMenuClose = ({
    isOpen,
    onClose,
    onCloseComplete
}: Pick<Props, 'isOpen' | 'onClose' | 'onCloseComplete'>) => {
    const pendingActionRef = useRef<EmptyFn | null>(null);

    const closeMenu = (afterClose?: EmptyFn) => {
        if (!isOpen) {
            return;
        }

        pendingActionRef.current = afterClose ?? null;
        onClose();
    };

    const handleCloseComplete = () => {
        if (isDefined(pendingActionRef.current)) {
            pendingActionRef.current();
            pendingActionRef.current = null;
        }

        onCloseComplete();
    };

    return { closeMenu, handleCloseComplete };
};

// eslint-disable-next-line max-statements -- Context menu component with deferred action pattern and multiple handlers
export const TransactionListContextMenu = ({ transaction, anchor, isOpen, onClose, onCloseComplete }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const deleteTransaction = useDeleteTransaction();
    const [openAccountSelector] = useAccountSelectorModal();
    const [openConvertToRefund] = useConvertToRefundModal();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const transactionId = transaction?.id ?? 0;
    const revertConsolidation = useRevertConsolidation(transactionId);
    const { closeMenu, handleCloseComplete } = useTransactionListContextMenuClose({ isOpen, onClose, onCloseComplete });

    if (!isDefined(transaction)) {
        return null;
    }

    const isConsolidated = isDefined(transaction.consolidationType);
    const isRefunded = isDefined(transaction.consolidationParentTransactionId);
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const categoryEntry = categoryEntries.at(0);
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
    const borrowedDebtCreateAction = getBorrowedDebtCreateAction({
        transaction,
        categoryEntry,
        debtAttachmentErrorMessage,
        formatDigits,
        t
    });

    const handleEditPress = () => {
        closeMenu(() => void router.push(getTransactionHref(transaction)));
    };

    const handleActionPress = () => {
        const deferredAction = isConsolidated
            ? revertConsolidation
            : () => {
                  deleteTransaction(transaction.id, { isConsolidated }).catch(emptyFn);
              };

        closeMenu(deferredAction);
    };

    const handleConvertPress = () => void closeMenu(() => void openTransactionListTransferConversion(transaction, openConvertToTransfer));

    const handleAttachDebtSettlementPress = () => {
        closeMenu(() => {
            openTransactionListDebtSettlementAttachment(transaction, openAccountSelector, {
                transactionAccountId,
                emptyStateDescription: debtAttachmentEmptyStateDescription,
                attachErrorMessage: debtAttachmentErrorMessage,
                createAction: borrowedDebtCreateAction
            });
        });
    };

    const handleConvertToRefundPress = () =>
        void closeMenu(() => {
            openConvertToRefund({ refundIncomeTransactionId: transaction.id }).catch(emptyFn);
        });

    return (
        <PopoverMenu isOpen={isOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor}>
            <TransactionListContextMenuItems
                canConvertToRefund={canConvertToRefund}
                canConvert={canConvert}
                canAttachDebtSettlement={canAttachDebtSettlement}
                actionIcon={actionIcon}
                actionLabel={actionLabel}
                actionTestID={actionTestID}
                onEdit={handleEditPress}
                onConvertToRefund={handleConvertToRefundPress}
                onConvert={handleConvertPress}
                onAttachDebtSettlement={handleAttachDebtSettlementPress}
                onAction={handleActionPress}
            />
        </PopoverMenu>
    );
};
