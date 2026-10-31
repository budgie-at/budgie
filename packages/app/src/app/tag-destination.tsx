import { isDefined } from '@rnw-community/shared';

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { TagDestinationSheet } from '../tag/components/tag-destination-sheet/tag-destination-sheet';
import { useTagsSelectorModal, useTagsSelectorModalParams } from '../tag/context/tags-selector-modal.context';

export default function TagDestinationModal() {
    const [, resolveTagsSelector, dismissTagsSelector] = useTagsSelectorModal();
    useModalDismiss(dismissTagsSelector);
    const currentParams = useTagsSelectorModalParams();

    const handleSelect = (tagId: number) => void resolveTagsSelector([tagId]);

    if (!isDefined(currentParams?.title) || !isDefined(currentParams.getCommitLabel)) {
        return null;
    }

    return (
        <TagDestinationSheet
            title={currentParams.title}
            description={currentParams.description}
            excludeTagIds={currentParams.excludeTagIds ?? []}
            getCommitLabel={currentParams.getCommitLabel}
            onSelect={handleSelect}
        />
    );
}
