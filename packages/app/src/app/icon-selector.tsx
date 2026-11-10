import { IconSelectorModalContent } from '../@generic/component/icon-selector-modal-content/icon-selector-modal-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';

import type { UserIconType } from '@budgie/contracts';

export default function IconSelectorModal() {
    const { params: modalParams, resolve: resolveIconSelector } = useModalRoute('/icon-selector');
    const { selectedIcon, keywords, excludedIcons } = modalParams ?? {};
    const { handleCommit, handleDismissed } = useMorphingSheetResult<UserIconType>(resolveIconSelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <IconSelectorModalContent
                selectedIcon={selectedIcon}
                keywords={keywords}
                excludedIcons={excludedIcons}
                onCommit={handleCommit}
            />
        </SingleStepMorphingSheet>
    );
}
