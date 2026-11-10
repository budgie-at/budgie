import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionCategoryFilterContent } from '../transaction/components/transaction-category-filter-content/transaction-category-filter-content';

import type { TransactionIdsFilterResultInterface } from '../transaction/interface/transaction-ids-filter-result.interface';

export default function TransactionCategoryFilterModal() {
    const { params: currentParams, resolve: resolveTransactionCategoryFilter } = useModalRoute('/transaction-category-filter');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionIdsFilterResultInterface>(resolveTransactionCategoryFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionCategoryFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
