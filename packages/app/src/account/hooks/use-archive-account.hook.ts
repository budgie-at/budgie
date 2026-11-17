import { ExternalSourceEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { EmptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../settings/mutation/update-settings.mutation';
import { householdAccountShareAtom } from '../constant/household-account-share-atom.constant';
import { useGetAccountByIdQuery } from '../query/use-get-account-by-id.query';
import { isAccountArchivable } from '../utils/is-account-archivable.util';

import { useShelvedAccountAction } from './use-shelved-account-action.hook';

export const useArchiveAccount = (accountId: number, onArchived: EmptyFn) => {
    const { t } = useLingui();
    const { isLoading, runWithFeedback } = useShelvedAccountAction();
    const { account } = useGetAccountByIdQuery(accountId);
    const shareStatusResult = useLiveAtomValue(householdAccountShareAtom(accountId));
    const isBrokerageCash = account?.externalSource === ExternalSourceEnum.MANUAL && account.instrument.type === InstrumentTypeEnum.FIAT;
    const isArchivable = isDefined(account) && isAccountArchivable(shareStatusResult);
    const isShareLoading = AsyncResult.isInitial(shareStatusResult);
    const defaultAccountId = useSetting('defaultAccountId');

    const accountTitle = account?.title ?? '';
    const isDefaultAccount = defaultAccountId === accountId;
    const archive = Effect.flatMap(AccountArchiveService, accountArchiveService =>
        isBrokerageCash && isDefined(account.integrationId)
            ? accountArchiveService.archiveByIntegrationId(account.integrationId)
            : accountArchiveService.archiveById(accountId).pipe(Effect.as([accountId]))
    );
    const restore = (archivedAccountIds: readonly number[]) =>
        Effect.flatMap(AccountArchiveService, accountArchiveService =>
            Effect.forEach(archivedAccountIds, archivedAccountId => accountArchiveService.restoreById(archivedAccountId), { discard: true })
        );
    const accountSuccessText = isNotEmptyString(accountTitle) ? t`Archived “${accountTitle}”` : t`Account archived`;

    const handleArchive = () => {
        if (!isArchivable) {
            return;
        }

        void runWithFeedback({
            action: archive.pipe(Effect.tap(() => Effect.sync(onArchived))),
            successText: isBrokerageCash ? t`Brokerage archived` : accountSuccessText,
            errorText: isBrokerageCash ? t`Could not archive brokerage.` : t`Could not archive account.`,
            undo: archivedAccountIds =>
                isDefaultAccount
                    ? restore(archivedAccountIds).pipe(Effect.andThen(updateSettingsMutation({ defaultAccountId: accountId })))
                    : restore(archivedAccountIds)
        });
    };

    return { handleArchive, isLoading, isArchivable, isShareLoading, isBrokerageCash };
};
