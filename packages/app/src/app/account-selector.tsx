import { isDefined } from '@rnw-community/shared';

import { SelectorMorphingSurface } from '../@generic/component/selector-morphing-surface/selector-morphing-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../@generic/constant/morphing-sheet-height-ratio.constant';
import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { useMorphingSheetListHeight } from '../@generic/hook/use-morphing-sheet-list-height.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { AccountSelectorModalContent } from '../account/component/account-selector-modal-content/account-selector-modal-content';
import { useAccountSelectorModal, useAccountSelectorModalParams } from '../account/context/account-selector-modal.context';

export default function AccountSelectorModal() {
    const [, resolveAccountSelector, dismissAccountSelector] = useAccountSelectorModal();
    const currentParams = useAccountSelectorModalParams();
    useModalRouteState(currentParams, dismissAccountSelector);
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveAccountSelector);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <SelectorMorphingSurface origin={currentParams.origin} onDismissed={handleDismissed} sheetStyle={listStyle}>
            <AccountSelectorModalContent params={currentParams} onCommit={handleCommit} />
        </SelectorMorphingSurface>
    );
}
