import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { CategoryDestinationModalContent } from '../category/components/category-destination-modal-content/category-destination-modal-content';

export default function CategoryDestinationModal() {
    const { params: currentParams, resolve: resolveCategoryDestination } = useModalRoute('/category-destination');
    useModalRouteState(currentParams);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveCategoryDestination);

    if (!isDefined(currentParams)) {
        return null;
    }

    return <CategoryDestinationModalContent params={currentParams} onCommit={handleCommit} onDismiss={handleDismissed} />;
}
