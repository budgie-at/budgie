import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { CategoryPickerPanel } from '../category-picker-panel/category-picker-panel';

import type { ModalParams } from '../../../@generic/type/modal-params.type';

interface Props {
    readonly params: ModalParams<'/category-selector'>;
    readonly onCommit: (categoryId: number) => void;
    readonly onCreate: (defaultTitle: string) => void;
}

export const CategorySelectorStep = ({ params, onCommit, onCreate }: Props) => {
    const { variant = 'primary', initialCategoryId = null, excludeCategoryIds, title, description, syncZone } = params;
    const handleSelect = useMorphingSheetCommit(onCommit);
    const pickerParams = { variant, initialCategoryId, excludeCategoryIds, title, description, syncZone };

    return <CategoryPickerPanel params={pickerParams} onSelect={handleSelect} onCreate={onCreate} />;
};
