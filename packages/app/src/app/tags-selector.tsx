import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TagsSelectorModalContent } from '../tag/components/tags-selector-modal-content/tags-selector-modal-content';

export default function TagsSelectorModal() {
    const { params: currentParams, resolve: resolveTagsSelector } = useModalRoute('/tags-selector');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number[]>(resolveTagsSelector);

    return <TagsSelectorModalContent params={currentParams ?? {}} onCommit={handleCommit} onDismiss={handleDismissed} />;
}
