import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { EmptyFn } from '@rnw-community/shared';

import { useEffectAction } from '../../@generic/hook/use-effect-action.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';

export const useArchiveAccount = (accountId: number, onArchived: EmptyFn) => {
    const { t } = useLingui();
    const [run, isLoading] = useEffectAction(t`Could not archive account`);

    const handleArchive = async () => {
        const confirmed = await confirmAlert({
            title: t`Archive Account?`,
            message: t`This account will be hidden from your main view and won't be included in totals. You can restore it anytime from Settings → Archived Accounts.`,
            confirmText: t`Archive`,
            cancelText: t`Cancel`,
            isDestructive: false
        });

        if (!confirmed) {
            return;
        }

        run(
            Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.archiveById(accountId)),
            onArchived
        );
    };

    return { handleArchive, isLoading };
};
