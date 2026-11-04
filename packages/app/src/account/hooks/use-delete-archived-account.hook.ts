import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';

import { useShelvedAccountAction } from './use-shelved-account-action.hook';

import type { AccountEntityInterface } from '@budgie/contracts';

export const useDeleteArchivedAccount = (account: Pick<AccountEntityInterface, 'id' | 'title'>) => {
    const { t } = useLingui();
    const { isLoading, runWithFeedback } = useShelvedAccountAction();
    const accountTitle = account.title;

    const confirmDeletion = confirmAlert({
        title: t`Delete “${accountTitle}” permanently?`,
        message: t`Its transactions go too. Transfers stay in the other account as “Transfer (account deleted)”. This can’t be undone.`,
        confirmText: t`Delete`,
        cancelText: t`Cancel`,
        isDestructive: true
    });

    const deleteAccount = () =>
        void appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    if (yield* confirmDeletion) {
                        runWithFeedback({
                            action: Effect.flatMap(AccountArchiveService, accountArchiveService =>
                                accountArchiveService.deleteById(account.id)
                            ),
                            successText: t`Deleted “${accountTitle}”`,
                            errorText: t`Could not delete account.`,
                            undo: null
                        });
                    }
                })
            )
        );

    return { isLoading, deleteAccount };
};
