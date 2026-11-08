import { Stack } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { AccountSelectorSheetContent } from '../account/component/account-selector-sheet-content/account-selector-sheet-content';
import { useAccountSelectorModal, useAccountSelectorModalParams } from '../account/context/account-selector-modal.context';

export default function AccountSelectorModal() {
    const [, resolveAccountSelector, dismissAccountSelector] = useAccountSelectorModal();
    const currentParams = useAccountSelectorModalParams();
    const screenOptions = useModalRouteState(currentParams, dismissAccountSelector);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <>
            <Stack.Screen options={screenOptions} />

            <AccountSelectorSheetContent params={currentParams} onSelect={resolveAccountSelector} />
        </>
    );
}
