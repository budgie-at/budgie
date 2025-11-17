import { AccountCreateEntityInterface, AccountEntityInterface, AccountUpdateEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository, db } from '../../@generic/drizzle/db/db';

class AccountService {
    async create(input: AccountCreateEntityInterface): Promise<AccountEntityInterface> {
        return await db.transaction(async tx => {
            const account = await accountRepository.create(input, tx);

            await accountBalanceRepository.create({ accountId: account.id, amount: input.currentBalance, parentAccountId: account.id }, tx);

            return account;
        });
    }

    async updateById(id: number, input: AccountUpdateEntityInterface): Promise<AccountEntityInterface> {
        return await db.transaction(async tx => {
            const account = await accountRepository.updateById(id, input, tx);

            if (isDefined(input.currentBalance)) {
                await accountBalanceRepository.updateByAccountId(account.id, { amount: input.currentBalance }, tx);
            }

            return account;
        });
    }
}

export const accountService = new AccountService();
