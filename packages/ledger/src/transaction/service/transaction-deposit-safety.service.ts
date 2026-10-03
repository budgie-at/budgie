import {
    AccountRepository,
    AccountTypeEnum,
    type TransactionCreateInputInterface,
    type TransactionEntryEntityInterface,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    type TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import { i18n } from '@lingui/core';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

export class TransactionDepositSafetyService extends Context.Service<TransactionDepositSafetyService>()(
    '@budgie/ledger/TransactionDepositSafetyService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const transactionRepository = yield* TransactionRepository;

            const assertNoDepositExpenseInputs = Effect.fn('TransactionDepositSafetyService.assertNoDepositExpenseInputs')(function* (
                inputs: readonly Pick<TransactionCreateInputInterface, 'entries' | 'fromAccountId' | 'type'>[]
            ) {
                const expenseSourceAccountIds = [
                    ...new Set(
                        inputs.flatMap(input =>
                            input.type === TransactionTypeEnum.EXPENSE
                                ? [
                                      ...(isDefined(input.fromAccountId) ? [input.fromAccountId] : []),
                                      ...input.entries
                                          .filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT)
                                          .map(entry => entry.accountId)
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
                    return yield* Effect.die(
                        new Error(i18n._({ id: 'transaction.depositExpenseDisallowed', message: 'Deposit accounts cannot fund expenses' }))
                    );
                }
            });

            const findTransactionsByEntries = Effect.fnUntraced(function* (existingEntries: readonly TransactionEntryEntityInterface[]) {
                const transactionIds = [...new Set(existingEntries.map(entry => entry.originalTransactionId ?? entry.transactionId))];

                return yield* transactionRepository.findByIds(transactionIds);
            });

            return {
                assertNoDepositExpenseInputs,
                assertNoDepositExpenseImportedEntries: Effect.fn('TransactionDepositSafetyService.assertNoDepositExpenseImportedEntries')(
                    function* (existingEntries: readonly TransactionEntryEntityInterface[]) {
                        if (!isNotEmptyArray(existingEntries)) {
                            return;
                        }

                        yield* assertNoDepositExpenseInputs(yield* findTransactionsByEntries(existingEntries));
                    }
                ),
                assertNoDepositExpenseTransactions: Effect.fn('TransactionDepositSafetyService.assertNoDepositExpenseTransactions')(
                    function* (transactions: readonly TransactionWithEntriesEntityInterface[]) {
                        yield* assertNoDepositExpenseInputs(transactions);
                    }
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransactionDepositSafetyService, TransactionDepositSafetyService.make).pipe(
        Layer.provide([AccountRepository.layer, TransactionRepository.layer])
    );
}
