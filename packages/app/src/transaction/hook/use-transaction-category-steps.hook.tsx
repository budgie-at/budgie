import { useState } from 'react';
import { View } from 'react-native';

import { SheetSurface } from '../../@generic/component/sheet-surface/sheet-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../@generic/constant/morphing-sheet-height-ratio.constant';
import { MorphingSheetPresentationEnum } from '../../@generic/enum/morphing-sheet-presentation.enum';
import { useMorphingSheetListHeight } from '../../@generic/hook/use-morphing-sheet-list-height.hook';
import { CategoryCreatePage } from '../../category/components/category-create-page/category-create-page';
import { CategoryPickerPanel } from '../../category/components/category-picker-panel/category-picker-panel';

import type { TransactionCategoryStepsConfigInterface } from '../interface/transaction-category-steps-config.interface';

export const useTransactionCategorySteps = (config: TransactionCategoryStepsConfigInterface) => {
    const { syncZone, onSelect, onBack, onShowCategory, onShowCreate } = config;
    const categoryStepStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const [createTitle, setCreateTitle] = useState('');

    const handleCreatePress = (defaultTitle: string) => {
        setCreateTitle(defaultTitle);
        onShowCreate();
    };

    return {
        category: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <View style={categoryStepStyle}>
                    <SheetSurface className="pt-lg">
                        <CategoryPickerPanel params={config} onSelect={onSelect} onBack={onBack} onCreate={handleCreatePress} />
                    </SheetSurface>
                </View>
            )
        },
        createCategory: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            content: <CategoryCreatePage defaultTitle={createTitle} syncZone={syncZone} onSelect={onSelect} onCancel={onShowCategory} />
        }
    };
};
