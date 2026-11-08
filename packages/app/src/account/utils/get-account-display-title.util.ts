import { t } from '@lingui/core/macro';

import { isUntrackedOwnAccount } from './is-untracked-own-account.util';

import type { AccountEntityInterface } from '@budgie/contracts';

export const getAccountDisplayTitle = (account: Pick<AccountEntityInterface, 'title' | 'externalId'>) =>
    isUntrackedOwnAccount(account) ? t`Other own accounts` : account.title;
