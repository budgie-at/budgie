import {
    AccountTypeEnum,
    type DB,
    type TransactionCreateInputInterface,
    type TransactionEntryEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    type TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { i18n } from '@lingui/core';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, transactionRepository } from '../../@generic/drizzle/db/db';

class TransactionDepositSafetyService {
    @Log(
        inputs => `enter count=${inputs.length}`,
        (_, inputs) => `done count=${inputs.length}`,
        (error, inputs) => `throw count=${inputs.length} error=${getErrorMessage(error)}`
    )
    async assertNoDepositExpenseInputs(
        inputs: readonly Pick<TransactionCreateInputInterface, 'entries' | 'fromAccountId' | 'type'>[],
        tx: DB
    ): Promise<void> {
        const expenseSourceAccountIds = [
            ...new Set(
                inputs.flatMap(input =>
                    input.type === TransactionTypeEnum.EXPENSE
                        ? [
                              ...(isDefined(input.fromAccountId) ? [input.fromAccountId] : []),
                              ...input.entries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT).map(entry => entry.accountId)
                          ]
                        : []
                )
            )
        ];

        if (!isNotEmptyArray(expenseSourceAccountIds)) {
            return;
        }

        const accounts = await accountRepository.findByIds(expenseSourceAccountIds, tx);
        const hasDepositAccount = accounts.some(account => account.type === AccountTypeEnum.DEPOSIT);

        if (hasDepositAccount) {
            throw new Error(i18n._({ id: 'transaction.depositExpenseDisallowed', message: 'Deposit accounts cannot fund expenses' }));
        }
    }

    @Log(
        existingEntries => `enter entryCount=${existingEntries.length}`,
        (_, existingEntries) => `done entryCount=${existingEntries.length}`,
        (error, existingEntries) => `throw entryCount=${existingEntries.length} error=${getErrorMessage(error)}`
    )
    async assertNoDepositExpenseImportedEntries(existingEntries: readonly TransactionEntryEntityInterface[], tx: DB): Promise<void> {
        if (!isNotEmptyArray(existingEntries)) {
            return;
        }

        await this.assertNoDepositExpenseTransactions(await this.findTransactionsByEntries(existingEntries, tx), tx);
    }

    @Log(
        transactions => `enter count=${transactions.length}`,
        (_, transactions) => `done count=${transactions.length}`,
        (error, transactions) => `throw count=${transactions.length} error=${getErrorMessage(error)}`
    )
    async assertNoDepositExpenseTransactions(transactions: readonly TransactionWithEntriesEntityInterface[], tx: DB): Promise<void> {
        await this.assertNoDepositExpenseInputs(transactions, tx);
    }

    private async findTransactionsByEntries(
        existingEntries: readonly TransactionEntryEntityInterface[],
        tx: DB
    ): Promise<TransactionWithEntriesEntityInterface[]> {
        const transactionIds = [...new Set(existingEntries.map(entry => entry.originalTransactionId ?? entry.transactionId))];

        return transactionRepository.findByIds(transactionIds, tx);
    }
}

export const transactionDepositSafetyService = new TransactionDepositSafetyService();
