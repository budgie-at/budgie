import { View } from 'react-native';

import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { CategoryPickerPanel } from '../category-picker-panel/category-picker-panel';

import type { CategorySelectorModalParams } from '../../context/category-selector-modal.context';

interface Props {
    readonly params: CategorySelectorModalParams;
    readonly onCommit: (categoryId: number) => void;
    readonly onCreate: (defaultTitle: string) => void;
}

export const CategorySelectorStep = ({ params, onCommit, onCreate }: Props) => {
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const handleSelect = useMorphingSheetCommit(onCommit);

    return (
        <View style={listStyle}>
            <SheetSurface className="pt-lg">
                <CategoryPickerPanel params={params} onSelect={handleSelect} onCreate={onCreate} />
            </SheetSurface>
        </View>
    );
};
