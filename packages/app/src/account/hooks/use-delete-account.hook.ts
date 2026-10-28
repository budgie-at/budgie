import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

export const useDeleteAccount = () => {
    const { t } = useLingui();

    return (id: number) =>
        Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.deleteById(id)).pipe(
            toastOnFailure(t`Could not delete account.`, t`Something went wrong. Please try again later.`)
        );
};
