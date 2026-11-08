import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { householdAccountShareAtom } from '../constant/household-account-share-atom.constant';
import { isAccountArchivable } from '../utils/is-account-archivable.util';

import { useShelvedAccountAction } from './use-shelved-account-action.hook';

import type { AccountEntityInterface } from '@budgie/contracts';

export const useRestoreArchivedAccount = (account: Pick<AccountEntityInterface, 'id' | 'title' | 'isActive'>) => {
    const { t } = useLingui();
    const { isLoading, runWithFeedback } = useShelvedAccountAction();
    const shareStatusResult = useLiveAtomValue(householdAccountShareAtom(account.id));
    const isArchivable = isAccountArchivable(shareStatusResult);
    const accountTitle = account.title;

    const restore = () =>
        void runWithFeedback({
            action: Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.restoreById(account.id)),
            successText: account.isActive ? t`“${accountTitle}” is back on Home` : t`“${accountTitle}” is back in Hidden accounts`,
            errorText: t`Could not restore account.`,
            undo: isArchivable
                ? Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.archiveById(account.id))
                : null
        });

    return { isLoading, restore };
};
