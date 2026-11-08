import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { AccountSelectorSheetContent } from '../account-selector-sheet-content/account-selector-sheet-content';

import type { AccountSelectorModalParams, AccountSelectorResult } from '../../context/account-selector-modal.context';

interface Props {
    readonly params: AccountSelectorModalParams;
    readonly onCommit: (accountId: AccountSelectorResult) => void;
}

export const AccountPanelContent = ({ params, onCommit }: Props) => {
    const commit = useMorphingSheetCommit(onCommit);

    return <AccountSelectorSheetContent params={params} onSelect={commit} isSearchAutoFocused />;
};
