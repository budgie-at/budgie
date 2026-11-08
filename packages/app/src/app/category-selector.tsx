import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { CategoryPickerPanel } from '../category/components/category-picker-panel/category-picker-panel';
import { useCategorySelectorModal, useCategorySelectorModalParams } from '../category/context/category-selector-modal.context';

export default function CategorySelectorModal() {
    const [, resolveCategorySelector, dismissCategorySelector] = useCategorySelectorModal();
    useModalDismiss(dismissCategorySelector);
    const currentParams = useCategorySelectorModalParams();

    return (
        <SheetSurface>
            <CategoryPickerPanel
                variant={currentParams?.variant ?? 'primary'}
                initialCategoryId={currentParams?.initialCategoryId ?? null}
                excludeCategoryIds={currentParams?.excludeCategoryIds}
                title={currentParams?.title}
                description={currentParams?.description}
                onSelect={resolveCategorySelector}
            />
        </SheetSurface>
    );
}
