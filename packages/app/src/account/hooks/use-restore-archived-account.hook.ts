import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useShelvedAccountAction } from './use-shelved-account-action.hook';

import type { AccountEntityInterface } from '@budgie/contracts';

export const useRestoreArchivedAccount = (account: Pick<AccountEntityInterface, 'id' | 'title' | 'isActive'>) => {
    const { t } = useLingui();
    const { isLoading, runWithFeedback } = useShelvedAccountAction();
    const accountTitle = account.title;

    const restore = () =>
        void runWithFeedback({
            action: Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.restoreById(account.id)),
            successText: account.isActive ? t`“${accountTitle}” is back on Home` : t`“${accountTitle}” is back in Hidden accounts`,
            errorText: t`Could not restore account.`,
            undo: Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.archiveById(account.id))
        });

    return { isLoading, restore };
};
