import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionTagFilterContent } from '../transaction/components/transaction-tag-filter-content/transaction-tag-filter-content';

import type { TransactionIdsFilterResultInterface } from '../transaction/interface/transaction-ids-filter-result.interface';

export default function TransactionTagFilterModal() {
    const { params: currentParams, resolve: resolveTransactionTagFilter } = useModalRoute('/transaction-tag-filter');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionIdsFilterResultInterface>(resolveTransactionTagFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionTagFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
