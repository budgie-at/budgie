import { AccountWithBankSyncEntityInterface } from '@budgie/contracts';

import { AccountRowInterface } from '../interface/account-row.interface';

export const pairAccountsIntoRows = (accounts: AccountWithBankSyncEntityInterface[]): AccountRowInterface[] => {
    const rows: AccountRowInterface[] = [];

    for (let index = 0; index < accounts.length; index += 2) {
        rows.push({
            left: accounts[index],
            right: accounts[index + 1]
        });
    }

    return rows;
};
