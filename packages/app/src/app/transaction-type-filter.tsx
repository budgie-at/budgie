import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionTypeFilterContent } from '../transaction/components/transaction-type-filter-content/transaction-type-filter-content';
import {
    useTransactionTypeFilterModal,
    useTransactionTypeFilterModalParams
} from '../transaction/context/transaction-type-filter-modal.context';

import type { TransactionTypeFilterResult } from '../transaction/context/transaction-type-filter-modal.context';

export default function TransactionTypeFilterModal() {
    const [, resolveTransactionTypeFilter, dismissTransactionTypeFilter] = useTransactionTypeFilterModal();
    useModalDismiss(dismissTransactionTypeFilter);
    const currentParams = useTransactionTypeFilterModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionTypeFilterResult>(resolveTransactionTypeFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionTypeFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
