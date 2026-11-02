import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { useGetAccountByIdQuery } from '../query/use-get-account-by-id.query';

import { useShelvedAccountAction } from './use-shelved-account-action.hook';

export const useArchiveAccount = (accountId: number, onArchived: EmptyFn) => {
    const { t } = useLingui();
    const { isLoading, runWithFeedback } = useShelvedAccountAction();
    const { account } = useGetAccountByIdQuery(accountId);
    const defaultAccountId = useSetting('defaultAccountId');

    const accountTitle = account?.title ?? '';
    const isDefaultAccount = defaultAccountId === accountId;
    const restore = Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.restoreById(accountId));

    const handleArchive = () =>
        void runWithFeedback({
            action: Effect.flatMap(AccountArchiveService, accountArchiveService => accountArchiveService.archiveById(accountId)).pipe(
                Effect.tap(() => Effect.sync(onArchived))
            ),
            successText: isNotEmptyString(accountTitle) ? t`Archived “${accountTitle}”` : t`Account archived`,
            errorText: t`Could not archive account.`,
            undo: isDefaultAccount ? restore.pipe(Effect.andThen(updateSettingsMutation({ defaultAccountId: accountId }))) : restore
        });

    return { handleArchive, isLoading };
};
