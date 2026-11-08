import { isDefined } from '@rnw-community/shared';

import { MorphingSheetListSheet } from '../@generic/component/morphing-sheet-list-sheet/morphing-sheet-list-sheet';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../@generic/constant/morphing-sheet-height-ratio.constant';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { CategoryDestinationSheet } from '../category/components/category-destination-sheet/category-destination-sheet';
import { useCategorySelectorModal, useCategorySelectorModalParams } from '../category/context/category-selector-modal.context';

export default function CategoryDestinationModal() {
    const [, resolveCategorySelector, dismissCategorySelector] = useCategorySelectorModal();
    useModalDismiss(dismissCategorySelector);
    const currentParams = useCategorySelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveCategorySelector);

    if (!isDefined(currentParams?.title) || !isDefined(currentParams.commitLabel) || !isDefined(currentParams.getCommitCopy)) {
        return null;
    }

    return (
        <MorphingSheetListSheet heightRatio={MORPHING_SHEET_DESTINATION_HEIGHT_RATIO} onDismiss={handleDismissed}>
            <CategoryDestinationSheet
                title={currentParams.title}
                description={currentParams.description}
                excludeCategoryIds={currentParams.excludeCategoryIds ?? []}
                commitLabel={currentParams.commitLabel}
                getCommitCopy={currentParams.getCommitCopy}
                onSelect={handleCommit}
            />
        </MorphingSheetListSheet>
    );
}
