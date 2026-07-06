import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { dismissAllOrReplace } from '../../@generic/utils/dismiss-all-or-replace.util';
import { useConvertToTransferModal } from '../context/convert-to-transfer-modal.context';

import { useDebtSettlementTransactionActions } from './use-debt-settlement-transaction-actions.hook';
import { useRevertConsolidation } from './use-revert-consolidation.hook';

import type { UpdateTransactionSharedActionsParamsInterface } from '../interface/update-transaction-shared-actions-params.interface';

export const useUpdateTransactionSharedActions = ({
    form,
    transaction,
    transactionAccountId,
    transactionId,
    transactionType
}: UpdateTransactionSharedActionsParamsInterface) => {
    const [openConvertToTransfer] = useConvertToTransferModal();
    const [sourceEntry] = transaction.entries;
    const handleRevert = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));
    const debtSettlementActions = useDebtSettlementTransactionActions({
        form,
        transaction,
        transactionId,
        transactionAccountId
    });

    const handleOpenConvert = () =>
        void openConvertToTransfer({
            transactionId,
            transactionType,
            excludeAccountId: transactionAccountId ?? 0,
            sourceAmount: convertFromMicroUnits(sourceEntry.amount),
            sourceInstrumentId: sourceEntry.account.instrumentId,
            sourceCode: sourceEntry.account.instrument.code
        });

    return {
        handleOpenConvert,
        handleRevert,
        ...debtSettlementActions
    };
};
