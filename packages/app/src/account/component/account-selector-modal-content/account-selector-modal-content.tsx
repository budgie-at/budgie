import { isDefined } from '@rnw-community/shared';

import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { AccountSelectorSheetContent } from '../account-selector-sheet-content/account-selector-sheet-content';

import type { AccountSelectorModalParams, AccountSelectorResult } from '../../context/account-selector-modal.context';

interface Props {
    readonly params: AccountSelectorModalParams;
    readonly onCommit: (accountId: number) => void;
}

export const AccountSelectorModalContent = ({ params, onCommit }: Props) => {
    const commit = useMorphingSheetCommit(onCommit);

    const handleSelect = (accountId: AccountSelectorResult) => {
        if (isDefined(accountId)) {
            commit(accountId);
        }
    };

    return (
        <AccountSelectorSheetContent
            className="pt-lg"
            params={params}
            onSelect={handleSelect}
            isSearchAutoFocused={isDefined(params.origin)}
        />
    );
};
