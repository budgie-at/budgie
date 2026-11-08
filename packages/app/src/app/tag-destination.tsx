import { isDefined } from '@rnw-community/shared';

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TagDestinationModalContent } from '../tag/components/tag-destination-modal-content/tag-destination-modal-content';
import { useTagsSelectorModal, useTagsSelectorModalParams } from '../tag/context/tags-selector-modal.context';

export default function TagDestinationModal() {
    const [, resolveTagsSelector, dismissTagsSelector] = useTagsSelectorModal();
    useModalDismiss(dismissTagsSelector);
    const currentParams = useTagsSelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number[]>(resolveTagsSelector);

    const handleSelect = (tagId: number) => {
        handleCommit([tagId]);
    };

    if (!isDefined(currentParams?.title) || !isDefined(currentParams.commitLabel) || !isDefined(currentParams.getCommitCopy)) {
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
