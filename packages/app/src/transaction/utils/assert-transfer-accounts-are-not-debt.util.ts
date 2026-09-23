import { AccountTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import type { AccountEntityInterface } from '@budgie/contracts';

export const assertTransferAccountsAreNotDebt = (accounts: readonly Pick<AccountEntityInterface, 'type'>[]): void => {
    if (accounts.some(account => account.type === AccountTypeEnum.DEBT)) {
        throw new Error(t`Debt accounts cannot take part in transfers`);
    }
};
