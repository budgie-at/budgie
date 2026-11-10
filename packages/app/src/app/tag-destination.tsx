import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { TagDestinationModalContent } from '../tag/components/tag-destination-modal-content/tag-destination-modal-content';

export default function TagDestinationModal() {
    const { params: currentParams, resolve: resolveTagDestination } = useModalRoute('/tag-destination');
    useModalRouteState(currentParams);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number[]>(resolveTagDestination);

    const handleSelect = (tagId: number) => {
        handleCommit([tagId]);
    };

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <TagDestinationModalContent
            title={currentParams.title}
            description={currentParams.description}
            excludeTagIds={currentParams.excludeTagIds}
            commitLabel={currentParams.commitLabel}
            getCommitCopy={currentParams.getCommitCopy}
            onCommit={handleSelect}
            onDismiss={handleDismissed}
        />
    );
}
