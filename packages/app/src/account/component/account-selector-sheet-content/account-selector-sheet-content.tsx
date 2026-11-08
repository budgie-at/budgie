import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../../../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { useAnchoredMorphPanelSettled } from '../../../@generic/context/anchored-morph-panel-settled.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';
import { useSearchAccountsSortedQuery } from '../../query/use-search-accounts-sorted.query';
import { isUntrackedOwnAccount } from '../../utils/is-untracked-own-account.util';
import { AccountSelectContent } from '../account-select-content/account-select-content';

import type { AccountSelectorModalParams, AccountSelectorResult } from '../../context/account-selector-modal.context';

interface Props {
    readonly params: AccountSelectorModalParams;
    readonly onSelect: (accountId: AccountSelectorResult) => void;
    readonly onBack?: () => void;
    readonly className?: string;
}

export const AccountSelectorSheetContent = ({ params, onSelect, onBack, className }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const isPanelSettled = useAnchoredMorphPanelSettled();

    const { createAction } = params;

    const { accounts } = useSearchAccountsSortedQuery(search, {
        debtType: params.debtType,
        excludeAccountId: params.excludeAccountId,
        excludeTypes: params.excludeAccountTypes,
        includeTypes: params.includeAccountTypes,
        onlyActive: params.onlyActive ?? true
    });
    const selectableAccounts = accounts.filter(account => !isUntrackedOwnAccount(account) || account.id === params.initialAccountId);

    const handleCreateAction = () => {
        if (!isDefined(createAction)) {
            return;
        }

        appRuntime.runFork(
            logAndContinue(
                Effect.tryPromise({ try: () => createAction.onCreate(), catch: getErrorMessage }).pipe(
                    Effect.tap(createdAccountId => Effect.sync(() => void onSelect(createdAccountId))),
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

    return (
        <SheetSurface className={className}>
            <SelectorModalSearchHeader
                title={t`Account`}
                placeholder={t`Search accounts…`}
                search={search}
                onSearchChange={setSearch}
                testID={AccountSelectorModalSelector.Input}
                onBack={onBack}
            />

            {isPanelSettled ? (
                <AccountSelectContent
                    data={selectableAccounts}
                    initialAccountId={params.initialAccountId ?? null}
                    search={search}
                    onSelect={onSelect}
                    emptyStateDescription={params.emptyStateDescription}
                    showDebtTotal={params.showDebtTotal ?? false}
                    createAction={contentCreateAction}
                />
            ) : null}
        </SheetSurface>
    );
};
