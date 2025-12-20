import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountUpdateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    convertToMicroUnits
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
import { SystemCategoryIdEnum } from '../../category/enum/system-category-id.enum';

class AccountService {
    async create(input: AccountCreateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.create(input, tx);

            await this.adjustBalanceTo(account.id, account.instrumentId, input.currentBalance, true, tx);

            return account;
        });
    }

    async updateById(id: number, input: AccountUpdateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const account = await accountRepository.updateById(id, input, tx);

            if (isNumber(input.currentBalance)) {
                await this.adjustBalanceTo(account.id, account.instrumentId, input.currentBalance, false, tx);
            }

            return account;
        });
    }

    // eslint-disable-next-line @typescript-eslint/max-params
    private async adjustBalanceTo(
        accountId: number,
        instrumentId: number,
        targetBalance: number,
        isInitial: boolean,
        tx: Transaction
    ): Promise<void> {
        const result = await accountBalanceRepository.getByAccountId(accountId);
        const currentBalanceMicro = result.at(0)?.balance ?? BigInt(0);

        const targetBalanceMicro = convertToMicroUnits(targetBalance);
        const delta = targetBalanceMicro - currentBalanceMicro;

        if (delta === BigInt(0)) {
            return;
        }

        const isDebit = delta > BigInt(0);
        const absDelta = delta < BigInt(0) ? -delta : delta;

        const transaction = await transactionRepository.create(
            {
                type: TransactionTypeEnum.ADJUSTMENT,
                title: '',
                comment: '',
                externalId: null,
                amount: absDelta,
                externalSource: null,
                operatedAt: new Date(),
                exchangeRate: convertToMicroUnits(1),
                fromAccountId: isDebit ? null : accountId,
                toAccountId: isDebit ? accountId : null
            },
            tx
        );

        await transactionEntryRepository.create(
            {
                accountId,
                instrumentId,
                amount: absDelta,
                transactionId: transaction.id,
                type: isDebit ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                categoryId: isInitial ? SystemCategoryIdEnum.INITIAL_BALANCE : SystemCategoryIdEnum.BALANCE_ADJUSTMENT
            },
            tx
        );

        await accountBalanceRepository.upsert({ accountId, amount: targetBalanceMicro }, tx);
    }
}

export const accountService = new AccountService();
