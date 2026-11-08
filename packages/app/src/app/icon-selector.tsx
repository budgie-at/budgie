import { IconSelectorModalContent } from '../@generic/component/icon-selector-modal-content/icon-selector-modal-content';
import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useIconSelectorModal, useIconSelectorModalParams } from '../@generic/context/icon-selector-modal.context';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';

import type { UserIconType } from '@budgie/contracts';

export default function IconSelectorModal() {
    const [, resolveIconSelector, dismissIconSelector] = useIconSelectorModal();
    useModalDismiss(dismissIconSelector);
    const { selectedIcon, keywords, excludedIcons } = useIconSelectorModalParams() ?? {};
    const { handleCommit, handleDismissed } = useMorphingSheetResult<UserIconType>(resolveIconSelector);

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed} isContentDraggable={false}>
            <IconSelectorModalContent
                selectedIcon={selectedIcon}
                keywords={keywords}
                excludedIcons={excludedIcons}
                onCommit={handleCommit}
            />
        </SingleStepMorphingSheet>
    );
}
