import {
    AccountTypeEnum,
    type TransactionCreateInputInterface,
    type TransactionEntryCreateInputInterface,
    type TransactionEntryEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    type TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { i18n } from '@lingui/core';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';

class TransactionDepositSafetyService {
    readonly assertNoDepositExpenseInputs = Effect.fn('TransactionDepositSafetyService.assertNoDepositExpenseInputs')(function* (
        inputs: readonly Pick<TransactionCreateInputInterface, 'entries' | 'fromAccountId' | 'type'>[]
    ) {
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

        const accounts = yield* accountRepository.findByIds(expenseSourceAccountIds);
        const hasDepositAccount = accounts.some(account => account.type === AccountTypeEnum.DEPOSIT);

        if (hasDepositAccount) {
            yield* Effect.die(
                new Error(i18n._({ id: 'transaction.depositExpenseDisallowed', message: 'Deposit accounts cannot fund expenses' }))
            );
        }
    });

    readonly assertNoDepositExpenseImportedUpdate = Effect.fn('TransactionDepositSafetyService.assertNoDepositExpenseImportedUpdate')(
        function* (this: TransactionDepositSafetyService, input: TransactionCreateInputInterface) {
            const existingEntries = (yield* Effect.forEach(input.entries, entry => this.findExistingImportedUpdateEntry(entry), {
                concurrency: 'unbounded'
            })).filter(isDefined);

            if (!isNotEmptyArray(existingEntries)) {
                return;
            }

            yield* this.assertNoDepositExpenseTransactions(yield* this.findTransactionsByEntries(existingEntries));
        }
    );

    readonly assertNoDepositExpenseTransactions = Effect.fn('TransactionDepositSafetyService.assertNoDepositExpenseTransactions')(
        function* (this: TransactionDepositSafetyService, transactions: readonly TransactionWithEntriesEntityInterface[]) {
            yield* this.assertNoDepositExpenseInputs(transactions);
        }
    );

    private readonly findExistingImportedUpdateEntry = Effect.fnUntraced(function* (
        entry: Pick<TransactionEntryCreateInputInterface, 'accountId' | 'externalId'>
    ) {
        if (!isDefined(entry.externalId)) {
            return null;
        }

        return (yield* transactionEntryRepository.findByExternalIdAndAccountId(entry.externalId, entry.accountId)) ?? null;
    });

    private readonly findTransactionsByEntries = Effect.fnUntraced(function* (existingEntries: readonly TransactionEntryEntityInterface[]) {
        const transactionIds = [...new Set(existingEntries.map(entry => entry.originalTransactionId ?? entry.transactionId))];

        return yield* transactionRepository.findByIds(transactionIds);
    });
}

export const transactionDepositSafetyService = new TransactionDepositSafetyService();
