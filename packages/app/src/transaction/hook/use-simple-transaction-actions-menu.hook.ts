import { AccountDebtTypeEnum, TransactionTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries, getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useOpenConvertToInstallment } from '../../installment-plan/hook/use-open-convert-to-installment.hook';
import { TransactionActionsMenuSelector } from '../components/transaction-actions-menu/transaction-actions-menu.selector';
import { canMarkPassiveIncome } from '../utils/can-mark-passive-income.util';

import { useDebtSettlementTransactionActions } from './use-debt-settlement-transaction-actions.hook';
import { useEditTransactionYield } from './use-edit-transaction-yield.hook';
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
    const openConvertToTransfer = useOpenModal('/convert-to-transfer');
    const openConvertToRefund = useOpenModal('/convert-to-refund');
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

    const { openKindPicker } = useEditTransactionYield(transaction);

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
    const isMarkableAsPassiveIncome = canMarkPassiveIncome(transactionType, transaction.yieldKind);
    const { debtSettlementAccount, hasDebtSettlement } = debtSettlementActions;
    const hasFee = isNotEmptyArray(getTransactionFeeEntries(transaction.entries));
    const isInstallment = debtSettlementAccount?.debtType === AccountDebtTypeEnum.INSTALLMENT;
    const debtTitle = debtSettlementAccount?.title;
    const detachConsequence = isDefined(debtTitle) ? { consequence: t`Detaches it from “${debtTitle}”` } : {};

    const allItems: readonly (TransactionActionsMenuItemInterface | false)[] = [
        {
            key: 'fee',
            icon: UserIconNameEnum.ReceiptText,
            label: hasFee ? t`Edit fee` : t`Add fee`,
            testID: TransactionActionsMenuSelector.FeeButton,
            isPrimary: false,
            onPress: onFeePress
        },
        isMarkableAsPassiveIncome && {
            key: 'passive-income',
            icon: UserIconNameEnum.Sprout,
            label: t`Mark as passive income`,
            testID: TransactionActionsMenuSelector.MarkPassiveIncomeButton,
            isPrimary: false,
            onPress: openKindPicker
        },
        !hasDebtSettlement && {
            key: 'attach-debt',
            icon: UserIconNameEnum.HandCoins,
            label: t`Attach debt`,
            testID: TransactionActionsMenuSelector.AttachDebtSettlementButton,
            isPrimary: false,
            onPress: debtSettlementActions.handleOpenDebtSettlement
        },
        hasDebtSettlement && {
            key: 'detach-debt',
            icon: UserIconNameEnum.Unlink,
            label: isInstallment ? t`Detach from plan` : t`Detach debt`,
            testID: TransactionActionsMenuSelector.DetachDebtSettlementButton,
            isPrimary: true,
            onPress: debtSettlementActions.handleDetachDebtSettlement
        },
        canConvertToRefund && {
            key: 'refund',
            icon: UserIconNameEnum.ReceiptText,
            label: t`Convert to Refund`,
            testID: TransactionActionsMenuSelector.ConvertToRefundButton,
            isPrimary: false,
            onPress: handleOpenRefundConvert
        },
        canConvertToTransfer && {
            key: 'transfer',
            icon: UserIconNameEnum.ArrowRightLeft,
            label: t`Convert to Transfer`,
            testID: TransactionActionsMenuSelector.ConvertToTransferButton,
            isPrimary: false,
            ...detachConsequence,
            onPress: handleOpenConvert
        },
        isDefined(handleOpenConvertToInstallment) &&
            categoryEntryCount === 1 && {
                key: 'installment',
                icon: UserIconNameEnum.CalendarClock,
                label: t`Pay in parts`,
                testID: TransactionActionsMenuSelector.ConvertToInstallmentButton,
                isPrimary: false,
                onPress: handleOpenConvertToInstallment
            },
        canStartDeposit && {
            key: 'deposit',
            icon: UserIconNameEnum.Landmark,
            label: t`Start Deposit`,
            testID: TransactionActionsMenuSelector.StartDepositButton,
            isPrimary: false,
            ...detachConsequence,
            onPress: handleOpenStartDeposit
        }
    ];

    return {
        actionsMenuProps: {
            transaction,
            onDelete,
            ...(isConsolidated && { onRevert: handleRevert }),
            items: allItems.filter(item => item !== false)
        },
        debtSettlementAccount
    };
};
