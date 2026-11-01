import { isDefined } from '@rnw-community/shared';

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { CategoryDestinationSheet } from '../category/components/category-destination-sheet/category-destination-sheet';
import { useCategorySelectorModal, useCategorySelectorModalParams } from '../category/context/category-selector-modal.context';

export default function CategoryDestinationModal() {
    const [, resolveCategorySelector, dismissCategorySelector] = useCategorySelectorModal();
    useModalDismiss(dismissCategorySelector);
    const currentParams = useCategorySelectorModalParams();

    if (!isDefined(currentParams?.title) || !isDefined(currentParams.commitLabel) || !isDefined(currentParams.getCommitSummary)) {
        return null;
    }

    return (
        <CategoryDestinationSheet
            title={currentParams.title}
            description={currentParams.description}
            excludeCategoryIds={currentParams.excludeCategoryIds ?? []}
            commitLabel={currentParams.commitLabel}
            getCommitSummary={currentParams.getCommitSummary}
            onSelect={resolveCategorySelector}
        />
    );
}
