import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionTypeFilterContent } from '../transaction/components/transaction-type-filter-content/transaction-type-filter-content';

import type { ModalResult } from '../@generic/type/modal-result.type';

export default function TransactionTypeFilterModal() {
    const { params: currentParams, resolve: resolveTransactionTypeFilter } = useModalRoute('/transaction-type-filter');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<ModalResult<'/transaction-type-filter'>>(resolveTransactionTypeFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionTypeFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
