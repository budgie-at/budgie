import { useAnchoredMorphPanelClose } from '../../../@generic/context/anchored-morph-panel.context';
import { AccountSelectorSheetContent } from '../account-selector-sheet-content/account-selector-sheet-content';

import type { AccountSelectorModalParams, AccountSelectorResult } from '../../context/account-selector-modal.context';

interface Props {
    readonly params: AccountSelectorModalParams;
    readonly onCommit: (accountId: AccountSelectorResult) => void;
}

export const AccountPanelContent = ({ params, onCommit }: Props) => {
    const close = useAnchoredMorphPanelClose();

    const handleSelect = (accountId: AccountSelectorResult) => {
        onCommit(accountId);
        close?.();
    };

    return <AccountSelectorSheetContent params={params} onSelect={handleSelect} />;
};
