import { AccountService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useShelvedAccountAction } from './use-shelved-account-action.hook';

import type { AccountEntityInterface } from '@budgie/contracts';

export const useUnhideAccount = (account: Pick<AccountEntityInterface, 'id' | 'title'>) => {
    const { t } = useLingui();
    const { isLoading, runWithFeedback } = useShelvedAccountAction();
    const accountTitle = account.title;

    const unhide = () =>
        void runWithFeedback({
            action: Effect.flatMap(AccountService, accountService => accountService.activateById(account.id)),
            successText: t`“${accountTitle}” is back on Home`,
            errorText: t`Could not unhide account.`,
            undo: Effect.flatMap(AccountService, accountService => accountService.updateById(account.id, { isActive: false }))
        });

    return { isLoading, unhide };
};
