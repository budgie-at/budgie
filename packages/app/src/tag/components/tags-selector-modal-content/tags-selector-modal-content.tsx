import { useReducer, useState } from 'react';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { TagsSelectorActionTypeEnum } from '../../enum/tags-selector-action-type.enum';
import { TagsSelectorStepEnum } from '../../enum/tags-selector-step.enum';
import { tagsSelectorReducer } from '../../utils/tags-selector-reducer.util';
import { TagsSelectorCreateStep } from '../tags-selector-create-step/tags-selector-create-step';
import { TagsSelectorStep } from '../tags-selector-step/tags-selector-step';

import type { TagsSelectorModalParams } from '../../context/tags-selector-modal.context';

interface Props {
    readonly params: TagsSelectorModalParams;
    readonly onCommit: (tagIds: number[]) => void;
    readonly onDismiss: () => void;
}

export const TagsSelectorModalContent = ({ params, onCommit, onDismiss }: Props) => {
    const { initialTagIds = [], suggestedTagIds = [], singleSelect = false, enablePrimarySelection = false } = params;
    const [step, setStep] = useState(TagsSelectorStepEnum.TAGS);
    const [search, setSearch] = useState('');
    const [selection, dispatch] = useReducer(tagsSelectorReducer, {
        selected: [...initialTagIds, ...suggestedTagIds.filter(tagId => !initialTagIds.includes(tagId))],
        primaryTagId: enablePrimarySelection ? (initialTagIds[0] ?? null) : null
    });

    const handleCreatePress = () => {
        setStep(TagsSelectorStepEnum.CREATE_TAG);
    };

    const handleCreateCancel = () => {
        setStep(TagsSelectorStepEnum.TAGS);
    };

    const handleTagAdded = (tagId: number) => {
        dispatch({ type: TagsSelectorActionTypeEnum.TAG_ADDED, tagId });
        setStep(TagsSelectorStepEnum.TAGS);
    };

    const steps = {
        [TagsSelectorStepEnum.TAGS]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <TagsSelectorStep
                    params={params}
                    selection={selection}
                    search={search}
                    dispatch={dispatch}
                    onSearchChange={setSearch}
                    onCreate={handleCreatePress}
                    onCommit={onCommit}
                />
            )
        },
        [TagsSelectorStepEnum.CREATE_TAG]: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            content: (
                <TagsSelectorCreateStep
                    defaultTitle={search.trim()}
                    singleSelect={singleSelect}
                    onCommit={onCommit}
                    onAdded={handleTagAdded}
                    onCancel={handleCreateCancel}
                />
            )
        }
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} isContentDraggable={false} />;
};
