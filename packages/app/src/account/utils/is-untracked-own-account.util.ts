import { AccountEntityInterface, UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID } from '@budgie/contracts';

export const isUntrackedOwnAccount = (account: Pick<AccountEntityInterface, 'externalId'>) =>
    account.externalId === UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID;
