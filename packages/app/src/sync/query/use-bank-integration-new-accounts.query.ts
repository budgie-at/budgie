import { BankIntegrationRepository } from '@budgie/contracts';
import { MonobankSyncService, SyncUnauthorizedError } from '@budgie/sync';
import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';

export const bankIntegrationAccountPreviewsAtom = Atom.family((integrationId: number) =>
    appAtomRuntime.atom(
        Effect.gen(function* () {
            const integration = yield* Effect.flatMap(BankIntegrationRepository, repository => repository.findById(integrationId));
            if (!isDefined(integration)) {
                return [];
            }

            return yield* Effect.flatMap(MonobankSyncService, monobankSyncService =>
                monobankSyncService.fetchAccountsPreview(integration.token)
            );
        })
    )
);

export const useBankIntegrationNewAccountsQuery = (integrationId: number, linkedExternalIds: ReadonlySet<string>) => {
    const previewsAtom = bankIntegrationAccountPreviewsAtom(integrationId);
    const result = useAtomValue(previewsAtom);
    const refresh = useAtomRefresh(previewsAtom);
    const error = AsyncResult.isFailure(result) ? Cause.squash(result.cause) : null;
    const newAccountPreviews = AsyncResult.getOrElse(result, () => []).filter(
        preview => !isDefined(preview.existingAccountId) && !linkedExternalIds.has(preview.externalId)
    );

    return {
        newAccountPreviews,
        isLoading: AsyncResult.isInitial(result) || result.waiting,
        isKeyRejected: error instanceof SyncUnauthorizedError,
        hasError: isDefined(error),
        refresh
    };
};
