import { isDefined } from '@rnw-community/shared';

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { TagDestinationSheet } from '../tag/components/tag-destination-sheet/tag-destination-sheet';
import { useTagsSelectorModal, useTagsSelectorModalParams } from '../tag/context/tags-selector-modal.context';

export default function TagDestinationModal() {
    const [, , dismissTagsSelector] = useTagsSelectorModal();
    useModalDismiss(dismissTagsSelector);
    const currentParams = useTagsSelectorModalParams();

    if (!isDefined(currentParams?.title) || !isDefined(currentParams.commitLabel) || !isDefined(currentParams.getCommitCopy)) {
        return null;
    }

    return <TagDestinationSheet />;
}
