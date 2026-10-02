import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';

import { useDebtSettlementTransactionActions } from './use-debt-settlement-transaction-actions.hook';
import { useOpenRefundConvert } from './use-open-refund-convert.hook';
import { useRevertConsolidation } from './use-revert-consolidation.hook';

import type { SimpleTransactionActionsMenuParamsInterface } from '../interface/simple-transaction-actions-menu-params.interface';

// eslint-disable-next-line max-statements -- Actions menu orchestration computing eligibility and handlers for multiple transaction conversion actions
export const useSimpleTransactionActionsMenu = ({
    transaction,
    transactionAccountId,
    transactionType,
    categoryEntryCount,
    onDelete,
    onFeePress
}: SimpleTransactionActionsMenuParamsInterface) => {
    const transactionId = transaction.id;
    const [openConvertToTransfer] = useConvertToTransferModal();
    const handleOpenRefundConvert = useOpenRefundConvert(transactionId);
    const persistedCategoryEntries = getTransactionCategoryEntries(transaction.entries);
    const [sourceEntry] = persistedCategoryEntries;
    const isConsolidated = isDefined(transaction.consolidationType);
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));
    const debtSettlementActions = useDebtSettlementTransactionActions({
        transaction,
        transactionId,
        transactionAccountId
    });

    const handleOpenConvert = (startDeposit = false) => {
        if (!isDefined(sourceEntry)) {
            return;
        }

        void openConvertToTransfer({
            transactionId,
            transactionType,
            excludeAccountId: (transactionType === TransactionTypeEnum.EXPENSE ? transaction.fromAccountId : transaction.toAccountId) ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceEntry.account.instrumentId,
            sourceCode: sourceEntry.account.instrument.code,
            startDeposit
        });
    };
    const handleOpenStartDeposit = () => void handleOpenConvert(true);

    const canConvertToRefund =
        transactionType === TransactionTypeEnum.INCOME && !isConsolidated && !isDefined(transaction.consolidationParentTransactionId);
    const refundConvertProps = canConvertToRefund ? { onConvertToRefund: handleOpenRefundConvert } : {};
    const canConvertToTransfer = persistedCategoryEntries.length === 1 && categoryEntryCount === 1;
    const transferConvertProps = canConvertToTransfer ? { onConvertToTransfer: handleOpenConvert } : {};
    const canStartDeposit = canConvertToTransfer && transactionType === TransactionTypeEnum.EXPENSE && !isConsolidated;
    const startDepositProps = canStartDeposit ? { onStartDeposit: handleOpenStartDeposit } : {};
    const debtSettlementProps = debtSettlementActions.hasDebtSettlement
        ? { onDetachDebtSettlement: debtSettlementActions.handleDetachDebtSettlement }
        : {
              onAttachDebtSettlement: debtSettlementActions.handleOpenDebtSettlement,
              ...(isDefined(debtSettlementActions.debtSettlementAccountTitle) && {
                  attachDebtSettlementLabel: debtSettlementActions.debtSettlementAccountTitle
              })
          };

    return {
        actionsMenuProps: {
            onDelete,
            isConsolidated,
            onRevert: handleRevert,
            onFeePress,
            ...refundConvertProps,
            ...transferConvertProps,
            ...startDepositProps,
            ...debtSettlementProps
        },
        debtSettlementAccountTitle: debtSettlementActions.debtSettlementAccountTitle
    };
};
