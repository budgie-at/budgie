import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { CategorySelectorModalContent } from '../category/components/category-selector-modal-content/category-selector-modal-content';

export default function CategorySelectorModal() {
    const { params: currentParams, resolve: resolveCategorySelector } = useModalRoute('/category-selector');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveCategorySelector);

    return <CategorySelectorModalContent params={currentParams ?? {}} onCommit={handleCommit} onDismiss={handleDismissed} />;
}
