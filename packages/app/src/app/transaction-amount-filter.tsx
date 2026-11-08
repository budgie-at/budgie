import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionAmountFilterContent } from '../transaction/components/transaction-amount-filter-content/transaction-amount-filter-content';
import {
    useTransactionAmountFilterModal,
    useTransactionAmountFilterModalParams
} from '../transaction/context/transaction-amount-filter-modal.context';

import type { TransactionAmountFilterResult } from '../transaction/context/transaction-amount-filter-modal.context';

export default function TransactionAmountFilterModal() {
    const [, resolveTransactionAmountFilter, dismissTransactionAmountFilter] = useTransactionAmountFilterModal();
    useModalDismiss(dismissTransactionAmountFilter);
    const currentParams = useTransactionAmountFilterModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionAmountFilterResult>(resolveTransactionAmountFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionAmountFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
