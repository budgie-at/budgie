import { isDefined } from '@rnw-community/shared';

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { CategoryDestinationModalContent } from '../category/components/category-destination-modal-content/category-destination-modal-content';
import { useCategorySelectorModal, useCategorySelectorModalParams } from '../category/context/category-selector-modal.context';

export default function CategoryDestinationModal() {
    const [, resolveCategorySelector, dismissCategorySelector] = useCategorySelectorModal();
    useModalDismiss(dismissCategorySelector);
    const currentParams = useCategorySelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveCategorySelector);

    if (!isDefined(currentParams)) {
        return null;
    }

    return <CategoryDestinationModalContent params={currentParams} onCommit={handleCommit} onDismiss={handleDismissed} />;
}
