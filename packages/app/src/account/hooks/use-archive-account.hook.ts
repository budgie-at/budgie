import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { EmptyFn } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

export const useArchiveAccount = (accountId: number, onArchived: EmptyFn) => {
    const { t } = useLingui();
    const { isLoading, run } = useSingleFlight();

    const handleArchive = () =>
        void run(
            Effect.gen(function* () {
                const confirmed = yield* confirmAlert({
                    title: t`Archive Account?`,
                    message: t`This account will be hidden from your main view and won't be included in totals. You can restore it anytime from Settings → Archived Accounts.`,
                    confirmText: t`Archive`,
                    cancelText: t`Cancel`,
                    isDestructive: false
                });

                if (!confirmed) {
                    return;
                }

                const accountArchiveService = yield* AccountArchiveService;

                yield* accountArchiveService.archiveById(accountId);
                onArchived();
            }).pipe(toastOnFailure(t`Could not archive account`))
        );

    return { handleArchive, isLoading };
};
