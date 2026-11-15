import { isDefined } from '@rnw-community/shared';

import { isUntrackedOwnAccount } from './is-untracked-own-account.util';

import type { AccountEntityInterface } from '@budgie/contracts';

export const isSelectableAccount = (
    account: Pick<AccountEntityInterface, 'id' | 'externalId' | 'syncZone'>,
    initialAccountId: number | null | undefined,
    syncZone: string | undefined
): boolean =>
    (!isUntrackedOwnAccount(account) || account.id === initialAccountId) && (!isDefined(syncZone) || account.syncZone === syncZone);
