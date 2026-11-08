import { View } from 'react-native';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { useDestinationFlow } from '../../../@generic/hook/use-destination-flow.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { CategorySelectorStepEnum } from '../../enum/category-selector-step.enum';
import { CategoryCreatePage } from '../category-create-page/category-create-page';
import { CategoryDestinationSheet } from '../category-destination-sheet/category-destination-sheet';

import type { CategoryDestinationParamsInterface } from '../../interface/category-destination-params.interface';

interface Props {
    readonly params: CategoryDestinationParamsInterface;
    readonly onCommit: (categoryId: number) => void;
    readonly onDismiss: () => void;
}

export const CategoryDestinationModalContent = (props: Props) => {
    const { params, onCommit, onDismiss } = props;
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_DESTINATION_HEIGHT_RATIO);
    const { step, createTitle, selection, handleCreatePress, handleCreated, handleCreateCancel } = useDestinationFlow(
        CategorySelectorStepEnum.CATEGORY,
        CategorySelectorStepEnum.CREATE_CATEGORY
    );

    const steps = {
        [CategorySelectorStepEnum.CATEGORY]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <View style={listStyle}>
                    <CategoryDestinationSheet params={params} selection={selection} onCommit={onCommit} onCreate={handleCreatePress} />
                </View>
            )
        },
        [CategorySelectorStepEnum.CREATE_CATEGORY]: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            onBack: handleCreateCancel,
            content: (
                <CategoryCreatePage
                    defaultTitle={createTitle}
                    syncZone={params.syncZone}
                    onSelect={handleCreated}
                    onCancel={handleCreateCancel}
                />
            )
        }
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} />;
};
