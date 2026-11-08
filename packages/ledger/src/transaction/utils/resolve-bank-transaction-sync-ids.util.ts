import { AccountRepository, TransactionRepository, deriveBankTransactionSyncId } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { getEntryAccountIds } from './get-entry-account-ids.util';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const resolveBankTransactionSyncIds = Effect.fnUntraced(function* (
    inputs: readonly TransactionCreateInputInterface[],
    accountRepository: typeof AccountRepository.Service,
    transactionRepository: typeof TransactionRepository.Service
) {
    const accounts = yield* accountRepository.findByIds(getEntryAccountIds(inputs));
    const accountExternalIdById = new Map(accounts.map(account => [account.id, account.externalId]));
    const derivedSyncIds = new Set<string>();
    const resolvedSyncIds = inputs.map(input => {
        const accountExternalId = input.entries.map(entry => accountExternalIdById.get(entry.accountId)).find(isNotEmptyString);
        if (!isDefined(accountExternalId) || !isNotEmptyString(input.externalId) || !isNotEmptyString(input.externalSource)) {
            return null;
        }
        const syncId = deriveBankTransactionSyncId(input.externalSource, accountExternalId, input.externalId);
        if (derivedSyncIds.has(syncId)) {
            return null;
        }
        derivedSyncIds.add(syncId);

        return syncId;
    });
    const claimedSyncIds = yield* transactionRepository.findClaimedPersonalSyncIds([...derivedSyncIds]);

    return resolvedSyncIds.map(syncId => (isDefined(syncId) && !claimedSyncIds.has(syncId) ? syncId : null));
});
