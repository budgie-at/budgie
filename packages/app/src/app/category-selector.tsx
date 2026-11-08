import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { CategorySelectorModalContent } from '../category/components/category-selector-modal-content/category-selector-modal-content';
import { useCategorySelectorModal, useCategorySelectorModalParams } from '../category/context/category-selector-modal.context';

export default function CategorySelectorModal() {
    const [, resolveCategorySelector, dismissCategorySelector] = useCategorySelectorModal();
    useModalDismiss(dismissCategorySelector);
    const currentParams = useCategorySelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveCategorySelector);

    return <CategorySelectorModalContent params={currentParams ?? {}} onCommit={handleCommit} onDismiss={handleDismissed} />;
}
