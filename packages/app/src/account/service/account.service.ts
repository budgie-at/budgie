import {
    AccountCreateEntityInterface,
    AccountEntityInterface,
    AccountUpdateEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isNumber, isPositiveNumber } from '@rnw-community/shared';

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
            const account = await accountRepository.create(
                {
                    ...input,
                    currentBalance: convertToMicroUnits(input.currentBalance)
                },
                tx
            );

            if (input.currentBalance !== 0) {
                await this.adjustBalanceTo(account.id, account.instrumentId, input.currentBalance, tx);
            }

            return account;
        });
    }

    async updateById(id: number, input: AccountUpdateEntityInterface): Promise<AccountEntityInterface> {
        return db.transaction(async tx => {
            const [{ balance: currentBalanceMicro }] = await accountRepository.getAccountBalance(id);

            const account = await accountRepository.updateById(
                id,
                {
                    ...input,
                    ...(isNumber(input.currentBalance) && {
                        currentBalance: convertToMicroUnits(input.currentBalance)
                    })
                },
                tx
            );

            if (isNumber(input.currentBalance) && convertToMicroUnits(input.currentBalance) !== currentBalanceMicro) {
                await this.adjustBalanceTo(account.id, account.instrumentId, input.currentBalance, tx);
            }

            return account;
        });
    }

    private async adjustBalanceTo(accountId: number, instrumentId: number, targetBalance: number, tx: Transaction): Promise<void> {
        const latest = await accountBalanceRepository.getAccountBalanceSnapshots([accountId]);
        const lastBalance = latest[0]?.amount ?? 0;
        const target = convertToMicroUnits(targetBalance);
        const delta = target - lastBalance;
        const absDelta = Math.abs(delta);

        if (delta === 0) {
            return;
        }

        const isDebit = isPositiveNumber(delta);

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

        await accountBalanceRepository.insertSnapshots([{ accountId, amount: absDelta }], tx);
    }
}

export const accountService = new AccountService();
