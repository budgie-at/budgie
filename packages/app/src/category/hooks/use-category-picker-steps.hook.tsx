import { useState } from 'react';

import { MorphingSheetPresentationEnum } from '../../@generic/enum/morphing-sheet-presentation.enum';
import { CategoryCreatePage } from '../components/category-create-page/category-create-page';
import { CategoryPickerPanel } from '../components/category-picker-panel/category-picker-panel';

import type { CategoryPickerStepsConfigInterface } from '../interface/category-picker-steps-config.interface';

export const useCategoryPickerSteps = (config: CategoryPickerStepsConfigInterface) => {
    const { onSelect, onBack, onShowCategory, onShowCreate, ...pickerParams } = config;
    const [createTitle, setCreateTitle] = useState('');

    const handleCreatePress = (defaultTitle: string) => {
        setCreateTitle(defaultTitle);
        onShowCreate();
    };

    return {
        category: {
            presentation: MorphingSheetPresentationEnum.CARD,
            onBack,
            content: <CategoryPickerPanel params={pickerParams} onSelect={onSelect} onBack={onBack} onCreate={handleCreatePress} />
        },
        createCategory: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            onBack: onShowCategory,
            content: (
                <CategoryCreatePage
                    defaultTitle={createTitle}
                    syncZone={pickerParams.syncZone}
                    onSelect={onSelect}
                    onCancel={onShowCategory}
                />
            )
        }
    };
};
