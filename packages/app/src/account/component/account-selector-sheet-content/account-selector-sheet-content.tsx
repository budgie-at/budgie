import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import Animated from 'react-native-reanimated';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { SelectorModalSearchHeader } from '../../../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { MOTION_FADE_IN } from '../../../@generic/constant/motion.constant';
import { useSurfaceSettled } from '../../../@generic/context/surface-settled.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';
import { useSearchAccountsSortedQuery } from '../../query/use-search-accounts-sorted.query';
import { isUntrackedOwnAccount } from '../../utils/is-untracked-own-account.util';
import { AccountSelectContent } from '../account-select-content/account-select-content';

import type { ModalParams } from '../../../@generic/type/modal-params.type';
import type { ModalResult } from '../../../@generic/type/modal-result.type';

interface Props {
    readonly params: ModalParams<'/account-selector'>;
    readonly onSelect: (accountId: ModalResult<'/account-selector'> | null) => void;
    readonly onBack?: () => void;
    readonly className?: string;
    readonly isSearchAutoFocused?: boolean;
}

export const AccountSelectorSheetContent = ({ params, onSelect, onBack, className, isSearchAutoFocused }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const isSettled = useSurfaceSettled();

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
                isAutoFocused={isSearchAutoFocused}
            />

            {isSettled ? (
                <Animated.View className="flex-1" entering={MOTION_FADE_IN}>
                    <AccountSelectContent
                        data={selectableAccounts}
                        initialAccountId={params.initialAccountId ?? null}
                        search={search}
                        onSelect={onSelect}
                        emptyStateDescription={params.emptyStateDescription}
                        showDebtTotal={params.showDebtTotal ?? false}
                        createAction={contentCreateAction}
                    />
                </Animated.View>
            ) : null}
        </SheetSurface>
    );
};
