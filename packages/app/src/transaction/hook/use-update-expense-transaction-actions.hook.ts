import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useConsolidationSourceModal } from '../context/consolidation-source-modal.context';
import { useConvertToRefundModal } from '../context/convert-to-refund-modal.context';
import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';

import { useRevertConsolidation } from './use-revert-consolidation.hook';

import type { UpdateExpenseTransactionActionsParamsInterface } from '../interface/update-expense-transaction-actions-params.interface';

export const useUpdateExpenseTransactionActions = ({
    transaction,
    transactionId,
    fromAccountId
}: UpdateExpenseTransactionActionsParamsInterface) => {
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [openConvertToRefund] = useConvertToRefundModal();
    const [openConsolidationSourceModal] = useConsolidationSourceModal();
    const [sourceEntry] = transaction.entries;
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));

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

    const handleOpenRefundConvert = () =>
        void openConvertToRefund({
            transactionId,
            transactionType: TransactionTypeEnum.EXPENSE
        }).then(canonicalId => {
            if (isDefined(canonicalId) && canonicalId !== transactionId) {
                const expenseRoute = `/transactions/${canonicalId}/expense` as const;

                dismissAllOrReplace(expenseRoute);
            }

            return null;
        });

    return { handleOpenConvert, handleOpenRefundConvert, handleOpenRefundSources, handleRevert };
};
