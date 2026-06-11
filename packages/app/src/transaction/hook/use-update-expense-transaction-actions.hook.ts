import { AccountDebtTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useConsolidationSourceModal } from '../context/consolidation-source-modal.context';
import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';

import { useDebtSettlementTransactionActions } from './use-debt-settlement-transaction-actions.hook';
import { useRevertConsolidation } from './use-revert-consolidation.hook';

import type { UpdateExpenseTransactionActionsParamsInterface } from '../interface/update-expense-transaction-actions-params.interface';

export const useUpdateExpenseTransactionActions = ({
    transaction,
    transactionId,
    fromAccountId
}: UpdateExpenseTransactionActionsParamsInterface) => {
    const { t } = useLingui();
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const [sourceEntry] = transaction.entries;
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));
    const { handleOpenDebtSettlement, handleDetachDebtSettlement, hasDebtSettlement, debtSettlementAccountTitle } =
        useDebtSettlementTransactionActions({
            transaction,
            transactionId,
            transactionAccountId: fromAccountId,
            debtType: AccountDebtTypeEnum.BORROW,
            emptyStateDescription: t`Create a borrowed debt account first.`,
            attachErrorMessage: t`Could not attach debt repayment`,
            detachErrorMessage: t`Could not detach debt repayment`
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
