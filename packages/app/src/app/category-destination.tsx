import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { CategoryDestinationModalContent } from '../category/components/category-destination-modal-content/category-destination-modal-content';

export default function CategoryDestinationModal() {
    const { params: currentParams, resolve: resolveCategorySelector } = useModalRoute('/category-destination');
    const isComplete = isDefined(currentParams?.title) && isDefined(currentParams.commitLabel) && isDefined(currentParams.getCommitCopy);
    useModalRouteState(isComplete ? currentParams : null);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveCategorySelector);

    if (!isComplete) {
        return null;
    }

    const destinationParams = {
        title: currentParams.title,
        description: currentParams.description,
        excludeCategoryIds: currentParams.excludeCategoryIds ?? [],
        syncZone: currentParams.syncZone,
        commitLabel: currentParams.commitLabel,
        getCommitCopy: currentParams.getCommitCopy
    };

    return <CategoryDestinationModalContent params={destinationParams} onCommit={handleCommit} onDismiss={handleDismissed} />;
}
