import { t } from '@lingui/core/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { isUntrackedOwnAccount } from '../../account/utils/is-untracked-own-account.util';

import type { AccountEntityInterface } from '@budgie/contracts';

export const getAccountInfoDescription = (account: Pick<AccountEntityInterface, 'iban' | 'externalId'>): string | null => {
    if (isUntrackedOwnAccount(account)) {
        return t`Automatic account`;
    }

    return isNotEmptyString(account.iban) ? `... ${account.iban.slice(-4)}` : null;
};
