import { UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID } from '@budgie/contracts';

import type { AccountEntityInterface } from '@budgie/contracts';

export const isUntrackedOwnAccount = (account: Pick<AccountEntityInterface, 'externalId'>) =>
    account.externalId === UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID;
