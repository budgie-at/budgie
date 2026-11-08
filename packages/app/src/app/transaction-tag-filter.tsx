import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionTagFilterContent } from '../transaction/components/transaction-tag-filter-content/transaction-tag-filter-content';
import {
    useTransactionTagFilterModal,
    useTransactionTagFilterModalParams
} from '../transaction/context/transaction-tag-filter-modal.context';

import type { TransactionTagFilterResult } from '../transaction/context/transaction-tag-filter-modal.context';

export default function TransactionTagFilterModal() {
    const [, resolveTransactionTagFilter, dismissTransactionTagFilter] = useTransactionTagFilterModal();
    useModalDismiss(dismissTransactionTagFilter);
    const currentParams = useTransactionTagFilterModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionTagFilterResult>(resolveTransactionTagFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionTagFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
