import { isDefined } from '@rnw-community/shared';

import { AnchoredMorphPanel } from '../@generic/component/anchored-morph-panel/anchored-morph-panel';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { AccountPanelContent } from '../account/component/account-panel-content/account-panel-content';
import {
    type AccountSelectorResult,
    useAccountSelectorModal,
    useAccountSelectorModalParams
} from '../account/context/account-selector-modal.context';

export default function AccountPanelModal() {
    const [, resolveAccountSelector, dismissAccountSelector] = useAccountSelectorModal();
    useModalDismiss(dismissAccountSelector);
    const currentParams = useAccountSelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<AccountSelectorResult>(resolveAccountSelector);

    if (!isDefined(currentParams?.origin)) {
        return null;
    }

    return (
        <AnchoredMorphPanel origin={currentParams.origin} onDismissed={handleDismissed}>
            <AccountPanelContent params={currentParams} onCommit={handleCommit} />
        </AnchoredMorphPanel>
    );
}
