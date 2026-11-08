import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionFeeModalContent } from '../transaction/components/transaction-fee-modal-content/transaction-fee-modal-content';
import { useTransactionFeeModal, useTransactionFeeModalParams } from '../transaction/context/transaction-fee-modal.context';

import type { TransactionFeeModalResult } from '../transaction/context/transaction-fee-modal.context';

export default function TransactionFeeModal() {
    const [, resolveTransactionFee, dismissTransactionFee] = useTransactionFeeModal();
    const currentParams = useTransactionFeeModalParams();
    useModalRouteState(currentParams, dismissTransactionFee);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionFeeModalResult>(resolveTransactionFee);

    if (!currentParams) {
        return null;
    }

    return (
        <TransactionFeeModalContent
            accountId={currentParams.accountId}
            currencySymbol={currentParams.currencySymbol}
            entry={currentParams.entry}
            variant={currentParams.variant}
            onConfirm={handleCommit}
            onDismiss={handleDismissed}
        />
    );
}
