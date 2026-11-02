import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Stack } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { useModalRouteState } from '../@generic/hook/use-modal-route-state/use-modal-route-state.hook';
import { appRuntime } from '../@generic/runtime/app.runtime';
import { logAndContinue } from '../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../@generic/utils/toast-on-failure.util';
import { AccountSelectContent } from '../account/component/account-select-content/account-select-content';
import { useAccountSelectorModal, useAccountSelectorModalParams } from '../account/context/account-selector-modal.context';
import { useSearchAccountsSortedQuery } from '../account/query/use-search-accounts-sorted.query';

import { AccountSelectorModalSelector } from './account-selector-modal.selector';

export default function AccountSelectorModal() {
    const { t } = useLingui();
    const [, resolveAccountSelector, dismissAccountSelector] = useAccountSelectorModal();
    const currentParams = useAccountSelectorModalParams();
    const screenOptions = useModalRouteState(currentParams, dismissAccountSelector);

    const [search, setSearch] = useState('');

    const createAction = currentParams?.createAction;

    const { accounts } = useSearchAccountsSortedQuery(search, {
        debtType: currentParams?.debtType,
        excludeAccountId: currentParams?.excludeAccountId,
        excludeTypes: currentParams?.excludeAccountTypes,
        includeTypes: currentParams?.includeAccountTypes,
        onlyActive: currentParams?.onlyActive ?? true
    });

    const handleCreateAction = () => {
        if (!isDefined(createAction)) {
            return;
        }

        appRuntime.runFork(
            logAndContinue(
                Effect.tryPromise({ try: () => createAction.onCreate(), catch: getErrorMessage }).pipe(
                    Effect.tap(createdAccountId => Effect.sync(() => void resolveAccountSelector(createdAccountId))),
                    toastOnFailure(createAction.errorMessage)
                )
            )
        );
    };
    const contentCreateAction = isDefined(createAction)
        ? {
              title: createAction.title,
              subtitle: createAction.subtitle,
              errorMessage: createAction.errorMessage,
              onCreate: handleCreateAction
          }
        : void 0;

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <SheetSurface>
            <Stack.Screen options={screenOptions} />

            <SelectorModalSearchHeader
                search={search}
                onSearchChange={setSearch}
                title={t`Account`}
                placeholder={t`Search accounts…`}
                testID={AccountSelectorModalSelector.Input}
            />

            <AccountSelectContent
                data={accounts}
                initialAccountId={currentParams.initialAccountId ?? null}
                search={search}
                onSelect={resolveAccountSelector}
                emptyStateDescription={currentParams.emptyStateDescription}
                showDebtTotal={currentParams.showDebtTotal ?? false}
                createAction={contentCreateAction}
            />
        </SheetSurface>
    );
}
