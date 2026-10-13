import { TransactionTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useOpenConvertToInstallment } from '../../installment-plan/hook/use-open-convert-to-installment.hook';
import { TransactionActionsMenuSelector } from '../components/transaction-actions-menu/transaction-actions-menu.selector';
import { useConvertToRefundModal } from '../context/convert-to-refund-modal.context';
import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';

import { useDebtSettlementTransactionActions } from './use-debt-settlement-transaction-actions.hook';
import { useRevertConsolidation } from './use-revert-consolidation.hook';

import type { SimpleTransactionActionsMenuParamsInterface } from '../interface/simple-transaction-actions-menu-params.interface';
import type { TransactionActionsMenuItemInterface } from '../interface/transaction-actions-menu-item.interface';

// eslint-disable-next-line max-statements, max-lines-per-function -- Actions menu orchestration computing eligibility and handlers for multiple transaction conversion actions
export const useSimpleTransactionActionsMenu = ({
    transaction,
    transactionAccountId,
    transactionType,
    categoryEntryCount,
    onDelete,
    onFeePress
}: SimpleTransactionActionsMenuParamsInterface) => {
    const transactionId = transaction.id;
    const { t } = useLingui();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [openConvertToRefund] = useConvertToRefundModal();
    const persistedCategoryEntries = getTransactionCategoryEntries(transaction.entries);
    const [sourceEntry] = persistedCategoryEntries;
    const isConsolidated = isDefined(transaction.consolidationType);
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));
    const handleOpenConvertToInstallment = useOpenConvertToInstallment(transaction);
    const debtSettlementActions = useDebtSettlementTransactionActions({
        transaction,
        transactionId,
        transactionAccountId
    });

    const handleOpenRefundConvert = () => {
        openConvertToRefund({ refundIncomeTransactionId: transactionId }, canonicalId => {
            if (isDefined(canonicalId)) {
                router.replace({ pathname: '/transactions/[id]/expense', params: { id: String(canonicalId) } });
            }
        });
    };

    const handleOpenConvert = () => {
        if (!isDefined(sourceEntry)) {
            return;
        }

        openConvertToTransfer({
            transactionId,
            transactionType,
            excludeAccountId: (transactionType === TransactionTypeEnum.EXPENSE ? transaction.fromAccountId : transaction.toAccountId) ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceEntry.account.instrumentId,
            sourceCode: sourceEntry.account.instrument.code
        });
    };
    const handleOpenStartDeposit = () => {
        router.push({ pathname: '/transactions/[id]/start-deposit', params: { id: String(transactionId) } });
    };

    const canConvertToRefund =
        transactionType === TransactionTypeEnum.INCOME && !isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const canConvertToTransfer = persistedCategoryEntries.length === 1 && categoryEntryCount === 1;
    const canStartDeposit =
        canConvertToTransfer &&
        transactionType === TransactionTypeEnum.EXPENSE &&
        !isConsolidated &&
        !isDefined(transaction.consolidationParentTransactionId);
    const { debtSettlementAccount, hasDebtSettlement } = debtSettlementActions;

    const allItems: readonly (TransactionActionsMenuItemInterface | false)[] = [
        {
            key: 'fee',
            icon: UserIconNameEnum.ReceiptText,
            label: t`Set fee`,
            testID: TransactionActionsMenuSelector.FeeButton,
            onPress: onFeePress
        },
        !hasDebtSettlement && {
            key: 'attach-debt',
            icon: UserIconNameEnum.HandCoins,
            label: debtSettlementAccount?.title ?? t`Attach debt`,
            testID: TransactionActionsMenuSelector.AttachDebtSettlementButton,
            onPress: debtSettlementActions.handleOpenDebtSettlement
        },
        hasDebtSettlement && {
            key: 'detach-debt',
            icon: UserIconNameEnum.Unlink,
            label: t`Detach debt`,
            testID: TransactionActionsMenuSelector.DetachDebtSettlementButton,
            onPress: debtSettlementActions.handleDetachDebtSettlement
        },
        canConvertToRefund && {
            key: 'refund',
            icon: UserIconNameEnum.ReceiptText,
            label: t`Convert to Refund`,
            testID: TransactionActionsMenuSelector.ConvertToRefundButton,
            onPress: handleOpenRefundConvert
        },
        canConvertToTransfer && {
            key: 'transfer',
            icon: UserIconNameEnum.ArrowRightLeft,
            label: t`Convert to Transfer`,
            testID: TransactionActionsMenuSelector.ConvertToTransferButton,
            onPress: handleOpenConvert
        },
        isDefined(handleOpenConvertToInstallment) &&
            categoryEntryCount === 1 && {
                key: 'installment',
                icon: UserIconNameEnum.CalendarClock,
                label: t`Pay in parts`,
                testID: TransactionActionsMenuSelector.ConvertToInstallmentButton,
                onPress: handleOpenConvertToInstallment
            },
        canStartDeposit && {
            key: 'deposit',
            icon: UserIconNameEnum.Landmark,
            label: t`Start Deposit`,
            testID: TransactionActionsMenuSelector.StartDepositButton,
            onPress: handleOpenStartDeposit
        }
    ];

    return {
        actionsMenuProps: {
            onDelete,
            isConsolidated,
            onRevert: handleRevert,
            items: allItems.filter(item => item !== false)
        },
        debtSettlementAccount
    };
};
