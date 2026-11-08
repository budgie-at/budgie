import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TagsSelectorModalContent } from '../tag/components/tags-selector-modal-content/tags-selector-modal-content';
import { useTagsSelectorModal, useTagsSelectorModalParams } from '../tag/context/tags-selector-modal.context';

export default function TagsSelectorModal() {
    const [, resolveTagsSelector, dismissTagsSelector] = useTagsSelectorModal();
    useModalDismiss(dismissTagsSelector);
    const currentParams = useTagsSelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number[]>(resolveTagsSelector);

    return <TagsSelectorModalContent params={currentParams ?? {}} onCommit={handleCommit} onDismiss={handleDismissed} />;
}
