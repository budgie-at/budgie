import { isDefined } from '@rnw-community/shared';

import { SingleStepMorphingSheet } from '../@generic/component/single-step-morphing-sheet/single-step-morphing-sheet';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { AccountSelectorCardContent } from '../account/component/account-selector-card-content/account-selector-card-content';
import { useAccountSelectorModal, useAccountSelectorModalParams } from '../account/context/account-selector-modal.context';

export default function AccountSelectorModal() {
    const [, resolveAccountSelector, dismissAccountSelector] = useAccountSelectorModal();
    useModalDismiss(dismissAccountSelector);
    const currentParams = useAccountSelectorModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<number>(resolveAccountSelector);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <SingleStepMorphingSheet onDismiss={handleDismissed}>
            <AccountSelectorCardContent params={currentParams} onCommit={handleCommit} />
        </SingleStepMorphingSheet>
    );
}
