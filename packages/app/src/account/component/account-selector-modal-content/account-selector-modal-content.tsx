import { isDefined } from '@rnw-community/shared';

import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { AccountSelectorSheetContent } from '../account-selector-sheet-content/account-selector-sheet-content';

import type { ModalParams } from '../../../@generic/type/modal-params.type';
import type { ModalResult } from '../../../@generic/type/modal-result.type';

interface Props {
    readonly params: ModalParams<'/account-selector'>;
    readonly onCommit: (accountId: number) => void;
}

export const AccountSelectorModalContent = ({ params, onCommit }: Props) => {
    const commit = useMorphingSheetCommit(onCommit);

    const handleSelect = (accountId: ModalResult<'/account-selector'> | null) => {
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
