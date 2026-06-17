import { TransactionTypeEnum } from '@budgie/contracts';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useConsolidationSourceModal } from '../context/consolidation-source-modal.context';
import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';

import { useRevertConsolidation } from './use-revert-consolidation.hook';
import { useUpdateTransactionDebtSettlementActions } from './use-update-transaction-debt-settlement-actions.hook';

import type { UpdateExpenseTransactionActionsParamsInterface } from '../interface/update-expense-transaction-actions-params.interface';

export const useUpdateExpenseTransactionActions = ({
    form,
    transaction,
    transactionId,
    fromAccountId
}: UpdateExpenseTransactionActionsParamsInterface) => {
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const [sourceEntry] = transaction.entries;
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));
    const { handleOpenDebtSettlement, handleDetachDebtSettlement, hasDebtSettlement, debtSettlementAccountTitle } =
        useUpdateTransactionDebtSettlementActions({
            form,
            transaction,
            transactionId,
            transactionAccountId: fromAccountId
        });

    const handleOpenRefundSources = () => void openConsolidationSourceModal({ transactionId });

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.EXPENSE,
            excludeAccountId: fromAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceEntry.account.instrumentId,
            sourceCode: sourceEntry.account.instrument.code
        });

    return {
        handleOpenConvert,
        handleOpenRefundSources,
        handleOpenDebtSettlement,
        handleDetachDebtSettlement,
        handleRevert,
        hasDebtSettlement,
        debtSettlementAccountTitle
    };
};
