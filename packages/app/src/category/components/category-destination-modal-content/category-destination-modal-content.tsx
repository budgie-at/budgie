import { useState } from 'react';
import { View } from 'react-native';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { CategorySelectorStepEnum } from '../../enum/category-selector-step.enum';
import { CategoryCreatePage } from '../category-create-page/category-create-page';
import { CategoryDestinationSheet } from '../category-destination-sheet/category-destination-sheet';

import type { DestinationCommitCopyInterface } from '../../../@generic/interface/destination-commit-copy.interface';

interface Props {
    readonly title: string;
    readonly syncZone: string | undefined;
    readonly description: string | undefined;
    readonly excludeCategoryIds: readonly number[];
    readonly commitLabel: string;
    readonly getCommitCopy: (destinationTitle: string) => DestinationCommitCopyInterface;
    readonly onCommit: (categoryId: number) => void;
    readonly onDismiss: () => void;
}

export const CategoryDestinationModalContent = (props: Props) => {
    const { title, description, excludeCategoryIds, syncZone, commitLabel, getCommitCopy, onCommit, onDismiss } = props;
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_DESTINATION_HEIGHT_RATIO);
    const [step, setStep] = useState(CategorySelectorStepEnum.CATEGORY);
    const [createTitle, setCreateTitle] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleCreatePress = (defaultTitle: string) => {
        setCreateTitle(defaultTitle);
        setStep(CategorySelectorStepEnum.CREATE_CATEGORY);
    };

    const handleCreated = (categoryId: number) => {
        setSelectedId(categoryId);
        setStep(CategorySelectorStepEnum.CATEGORY);
    };

    const handleCreateCancel = () => {
        setStep(CategorySelectorStepEnum.CATEGORY);
    };

    const selection = { selectedId, onSelect: setSelectedId };

    const steps = {
        [CategorySelectorStepEnum.CATEGORY]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <View style={listStyle}>
                    <CategoryDestinationSheet
                        title={title}
                        description={description}
                        excludeCategoryIds={excludeCategoryIds}
                        commitLabel={commitLabel}
                        getCommitCopy={getCommitCopy}
                        selection={selection}
                        onCommit={onCommit}
                        onCreate={handleCreatePress}
                    />
                </View>
            )
        },
        [CategorySelectorStepEnum.CREATE_CATEGORY]: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            content: (
                <CategoryCreatePage defaultTitle={createTitle} syncZone={syncZone} onSelect={handleCreated} onCancel={handleCreateCancel} />
            )
        }
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} isContentDraggable={false} />;
};
