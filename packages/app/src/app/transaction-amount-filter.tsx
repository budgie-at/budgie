import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TransactionAmountFilterContent } from '../transaction/components/transaction-amount-filter-content/transaction-amount-filter-content';

import type { ModalResult } from '../@generic/type/modal-result.type';

export default function TransactionAmountFilterModal() {
    const { params: currentParams, resolve: resolveTransactionAmountFilter } = useModalRoute('/transaction-amount-filter');
    const { handleCommit, handleDismissed } =
        useMorphingSheetResult<ModalResult<'/transaction-amount-filter'>>(resolveTransactionAmountFilter);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <TransactionAmountFilterContent value={currentParams?.value ?? null} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
