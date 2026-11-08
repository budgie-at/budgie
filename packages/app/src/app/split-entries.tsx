import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { SplitEntriesModalContent } from '../transaction/components/split-entries-modal-content/split-entries-modal-content';
import { useSplitEntriesModal, useSplitEntriesModalParams } from '../transaction/context/split-entries-modal.context';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export default function SplitEntriesModal() {
    const [, resolveSplitEntries, dismissSplitEntries] = useSplitEntriesModal();
    const currentParams = useSplitEntriesModalParams();
    useModalRouteState(currentParams, dismissSplitEntries);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionEntryCreateInputInterface[]>(resolveSplitEntries);

    if (!currentParams) {
        return null;
    }

    return (
        <SplitEntriesModalContent
            initialEntries={currentParams.entries}
            variant={currentParams.variant}
            entryType={currentParams.entryType}
            currencySymbol={currentParams.currencySymbol}
            totalAmount={currentParams.totalAmount}
            onConfirm={handleCommit}
            onDismiss={handleDismissed}
        />
    );
}
