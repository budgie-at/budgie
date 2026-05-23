import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useConvertToRefundModal } from '../context/convert-to-refund-modal.context';
import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';

import { useRevertConsolidation } from './use-revert-consolidation.hook';

import type { UpdateIncomeTransactionActionsParamsInterface } from '../interface/update-income-transaction-actions-params.interface';

export const useUpdateIncomeTransactionActions = ({
    transaction,
    transactionId,
    toAccountId
}: UpdateIncomeTransactionActionsParamsInterface) => {
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [openConvertToRefund] = useConvertToRefundModal();
    const [sourceEntry] = transaction.entries;
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType: TransactionTypeEnum.INCOME,
            excludeAccountId: toAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceEntry.account.instrumentId,
            sourceCode: sourceEntry.account.instrument.code
        });

    const handleOpenRefundConvert = () =>
        void openConvertToRefund({
            transactionId,
            transactionType: TransactionTypeEnum.INCOME
        }).then(canonicalId => {
            if (isDefined(canonicalId)) {
                const expenseRoute = `/transactions/${canonicalId}/expense` as const;

                dismissAllOrReplace(expenseRoute);
            }

            return null;
        });

    return { handleOpenConvert, handleOpenRefundConvert, handleRevert };
};
