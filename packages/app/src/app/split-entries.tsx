import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { SplitEntriesModalContent } from '../transaction/components/split-entries-modal-content/split-entries-modal-content';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export default function SplitEntriesModal() {
    const { params: currentParams, resolve: resolveSplitEntries } = useModalRoute('/split-entries');
    useModalRouteState(currentParams);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<TransactionEntryCreateInputInterface[]>(resolveSplitEntries);

    if (!isDefined(currentParams)) {
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
