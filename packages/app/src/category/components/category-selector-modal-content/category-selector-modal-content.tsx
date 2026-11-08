import { useState } from 'react';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { CategorySelectorStepEnum } from '../../enum/category-selector-step.enum';
import { CategorySelectorCreateStep } from '../category-selector-create-step/category-selector-create-step';
import { CategorySelectorStep } from '../category-selector-step/category-selector-step';

import type { CategorySelectorModalParams } from '../../context/category-selector-modal.context';

interface Props {
    readonly params: CategorySelectorModalParams;
    readonly onCommit: (categoryId: number) => void;
    readonly onDismiss: () => void;
}

export const CategorySelectorModalContent = ({ params, onCommit, onDismiss }: Props) => {
    const [step, setStep] = useState(CategorySelectorStepEnum.CATEGORY);
    const [createTitle, setCreateTitle] = useState('');

    const handleCreatePress = (defaultTitle: string) => {
        setCreateTitle(defaultTitle);
        setStep(CategorySelectorStepEnum.CREATE_CATEGORY);
    };

    const handleCreateCancel = () => {
        setStep(CategorySelectorStepEnum.CATEGORY);
    };

    const steps = {
        [CategorySelectorStepEnum.CATEGORY]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: <CategorySelectorStep params={params} onCommit={onCommit} onCreate={handleCreatePress} />
        },
        [CategorySelectorStepEnum.CREATE_CATEGORY]: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            content: (
                <CategorySelectorCreateStep
                    defaultTitle={createTitle}
                    syncZone={params.syncZone}
                    onCommit={onCommit}
                    onCancel={handleCreateCancel}
                />
            )
        }
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} isContentDraggable={false} />;
};
