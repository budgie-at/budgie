import { useState } from 'react';
import { View } from 'react-native';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { TagsSelectorStepEnum } from '../../enum/tags-selector-step.enum';
import { TagDestinationSheet } from '../tag-destination-sheet/tag-destination-sheet';
import { TagForm } from '../tag-form/tag-form';

import type { DestinationCommitCopyInterface } from '../../../@generic/interface/destination-commit-copy.interface';
import type { TagFormResultInterface } from '../../interface/tag-form-result.interface';

interface Props {
    readonly title: string;
    readonly description: string | undefined;
    readonly excludeTagIds: readonly number[];
    readonly commitLabel: string;
    readonly getCommitCopy: (destinationTitle: string) => DestinationCommitCopyInterface;
    readonly onCommit: (tagId: number) => void;
    readonly onDismiss: () => void;
}

export const TagDestinationModalContent = (props: Props) => {
    const { title, description, excludeTagIds, commitLabel, getCommitCopy, onCommit, onDismiss } = props;
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_DESTINATION_HEIGHT_RATIO);
    const [step, setStep] = useState(TagsSelectorStepEnum.TAGS);
    const [createTitle, setCreateTitle] = useState('');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const handleCreatePress = (defaultTitle: string) => {
        setCreateTitle(defaultTitle);
        setStep(TagsSelectorStepEnum.CREATE_TAG);
    };

    const handleCreated = ({ tag }: TagFormResultInterface) => {
        setSelectedId(tag.id);
        setStep(TagsSelectorStepEnum.TAGS);
    };

    const handleCreateCancel = () => {
        setStep(TagsSelectorStepEnum.TAGS);
    };

    const selection = { selectedId, onSelect: setSelectedId };

    const steps = {
        [TagsSelectorStepEnum.TAGS]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <View style={listStyle}>
                    <TagDestinationSheet
                        title={title}
                        description={description}
                        excludeTagIds={excludeTagIds}
                        commitLabel={commitLabel}
                        getCommitCopy={getCommitCopy}
                        selection={selection}
                        onCommit={onCommit}
                        onCreate={handleCreatePress}
                    />
                </View>
            )
        },
        [TagsSelectorStepEnum.CREATE_TAG]: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            onBack: handleCreateCancel,
            content: <TagForm defaultTitle={createTitle} onSuccess={handleCreated} onCancel={handleCreateCancel} />
        }
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} />;
};
