import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionCategoryFilterContent } from '../transaction/components/transaction-category-filter-content/transaction-category-filter-content';
import {
    useTransactionCategoryFilterModal,
    useTransactionCategoryFilterModalParams
} from '../transaction/context/transaction-category-filter-modal.context';

import type { TransactionIdsFilterResultInterface } from '../transaction/interface/transaction-ids-filter-result.interface';

export default function TransactionCategoryFilterModal() {
    const [, resolveTransactionCategoryFilter, dismissTransactionCategoryFilter] = useTransactionCategoryFilterModal();
    useModalDismiss(dismissTransactionCategoryFilter);
    const currentParams = useTransactionCategoryFilterModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionIdsFilterResultInterface>(resolveTransactionCategoryFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionCategoryFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
