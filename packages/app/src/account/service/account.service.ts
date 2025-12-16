import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountUpdateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    accountRepository,
    db,
    transactionEntryRepository,
    transactionRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

class AccountService {
    async create(input: AccountCreateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.create(input, tx);

            await this.adjustBalanceTo(account.id, account.instrumentId, input.currentBalance, tx);

            return account;
        });
    }

    async updateById(id: number, input: AccountUpdateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.updateById(id, input, tx);

            if (isNumber(input.currentBalance)) {
                await this.adjustBalanceTo(account.id, account.instrumentId, input.currentBalance, tx);
            }

            return account;
        });
    }

    private async adjustBalanceTo(accountId: number, instrumentId: number, targetBalance: number, tx: Transaction): Promise<void> {
        const result = await accountBalanceRepository.getByAccountId(accountId);
        const currentBalanceMicro = result.at(0)?.balance ?? 0;

        const targetBalanceMicro = convertToMicroUnits(targetBalance);
        const delta = targetBalanceMicro - currentBalanceMicro;

        if (delta === 0) {
            return;
        }

        const isDebit = delta > 0;
        const absDelta = Math.abs(delta);

        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt: new Date(),
                amount: absDelta,
                exchangeRate: 1,
                tagIds: [],
                entries: [],
                fromAccountId: isDebit ? null : accountId,
                toAccountId: isDebit ? accountId : null
            },
            tx
        );

        await transactionEntryRepository.create(
            {
                accountId,
                instrumentId,
                transactionId: transaction.id,
                categoryId: null,
                amount: absDelta,
                type: isDebit ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT
            },
            tx
        );

        await accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro }, tx);
    }
}

export const accountService = new AccountService();
