import { isDefined } from '@rnw-community/shared';

import { MorphingSheetListSheet } from '../@generic/component/morphing-sheet-list-sheet/morphing-sheet-list-sheet';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../@generic/constant/morphing-sheet-height-ratio.constant';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TagDestinationSheet } from '../tag/components/tag-destination-sheet/tag-destination-sheet';
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
        <MorphingSheetListSheet heightRatio={MORPHING_SHEET_DESTINATION_HEIGHT_RATIO} onDismiss={handleDismissed}>
            <TagDestinationSheet
                title={currentParams.title}
                description={currentParams.description}
                excludeTagIds={currentParams.excludeTagIds ?? []}
                commitLabel={currentParams.commitLabel}
                getCommitCopy={currentParams.getCommitCopy}
                onSelect={handleSelect}
            />
        </MorphingSheetListSheet>
    );
}
