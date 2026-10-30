import { isDefined } from '@rnw-community/shared';

import type { AccountEntityInterface } from '@budgie/contracts';

export const getAccountIbanSuffix = (account: Pick<AccountEntityInterface, 'iban'> | null): string | null =>
    isDefined(account?.iban) ? `... ${account.iban.slice(-4)}` : null;
