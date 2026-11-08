import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { AccountSelectorSheetContent } from '../account-selector-sheet-content/account-selector-sheet-content';

import type { AccountSelectorModalParams, AccountSelectorResult } from '../../context/account-selector-modal.context';

interface Props {
    readonly params: AccountSelectorModalParams;
    readonly onCommit: (accountId: number) => void;
}

export const AccountSelectorCardContent = ({ params, onCommit }: Props) => {
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);

    const handleSelect = (accountId: AccountSelectorResult) => {
        if (isDefined(accountId)) {
            commit(accountId);
        }
    };

    return (
        <View style={listStyle}>
            <AccountSelectorSheetContent className="pt-lg" params={params} onSelect={handleSelect} />
        </View>
    );
};
