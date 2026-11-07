import { deriveBankTransactionSyncId } from '@budgie/contracts';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const resolveBankTransactionSyncId = (
    input: Pick<TransactionCreateInputInterface, 'entries' | 'externalId' | 'externalSource'>,
    accountExternalIdById: ReadonlyMap<number, string | null>,
    claimedSyncIds: Set<string>
): string | null => {
    const accountExternalId = input.entries.map(entry => accountExternalIdById.get(entry.accountId)).find(isNotEmptyString);

    if (!isDefined(accountExternalId) || !isNotEmptyString(input.externalId) || !isNotEmptyString(input.externalSource)) {
        return null;
    }

    const syncId = deriveBankTransactionSyncId(input.externalSource, accountExternalId, input.externalId);

    if (claimedSyncIds.has(syncId)) {
        return null;
    }

    claimedSyncIds.add(syncId);

    return syncId;
};
