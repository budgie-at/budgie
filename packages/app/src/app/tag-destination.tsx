import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TagDestinationModalContent } from '../tag/components/tag-destination-modal-content/tag-destination-modal-content';
import { useTagsSelectorModal, useTagsSelectorModalParams } from '../tag/context/tags-selector-modal.context';

export default function TagDestinationModal() {
    const [, resolveTagsSelector, dismissTagsSelector] = useTagsSelectorModal();
    const currentParams = useTagsSelectorModalParams();
    const isComplete = isDefined(currentParams?.title) && isDefined(currentParams.commitLabel) && isDefined(currentParams.getCommitCopy);
    useModalRouteState(isComplete ? currentParams : null, dismissTagsSelector);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number[]>(resolveTagsSelector);

    const handleSelect = (tagId: number) => {
        handleCommit([tagId]);
    };

    if (!isComplete) {
        return null;
    }

    return (
        <TagDestinationModalContent
            title={currentParams.title}
            description={currentParams.description}
            excludeTagIds={currentParams.excludeTagIds ?? []}
            commitLabel={currentParams.commitLabel}
            getCommitCopy={currentParams.getCommitCopy}
            onCommit={handleSelect}
            onDismiss={handleDismissed}
        />
    );
}
