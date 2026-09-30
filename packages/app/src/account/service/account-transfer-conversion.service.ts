import {
    TransactionEntryCreateEntityInterface,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

export class AccountTransferConversionService extends Context.Service<AccountTransferConversionService>()(
    '@budgie/app/AccountTransferConversionService',
    {
        make: Effect.gen(function* () {
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionRepository = yield* TransactionRepository;

            const collectTransferEntries = (transfers: TransactionWithEntriesEntityInterface[], accountId: number) => {
                const entriesToCreate: TransactionEntryCreateEntityInterface[] = [];

                for (const transfer of transfers) {
                    const isFromDeleted = transfer.fromAccountId === accountId;

                    if (isFromDeleted) {
                        const debitEntry = transfer.entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
                        if (isDefined(debitEntry) && isDefined(transfer.toAccountId)) {
                            entriesToCreate.push({
                                ...debitEntry,
                                transactionId: transfer.id,
                                accountId: transfer.toAccountId,
                                type: TransactionEntryTypeEnum.DEBIT
                            });
                        }
                    } else {
                        const creditEntry = transfer.entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
                        if (isDefined(creditEntry) && isDefined(transfer.fromAccountId)) {
                            entriesToCreate.push({
                                ...creditEntry,
                                transactionId: transfer.id,
                                accountId: transfer.fromAccountId,
                                type: TransactionEntryTypeEnum.CREDIT
                            });
                        }
                    }
                }

                return entriesToCreate;
            };

            return {
                convertAccountTransfers: Effect.fn('AccountTransferConversionService.convertAccountTransfers')(function* (
                    accountId: number
                ) {
                    const transfers = yield* transactionRepository.findTransfersForConversion(accountId);

                    if (!isNotEmptyArray(transfers)) {
                        return;
                    }

                    yield* transactionRepository.convertTransfersFromAccountToIncome(accountId);
                    yield* transactionRepository.convertTransfersToAccountToExpense(accountId);

                    const entriesToCreate = collectTransferEntries(transfers, accountId);
                    const transactionIds = transfers.map(transaction => transaction.id);

                    yield* transactionEntryRepository.deleteByTransactionIds(transactionIds);

                    if (isNotEmptyArray(entriesToCreate)) {
                        yield* transactionEntryRepository.bulkCreate(entriesToCreate);
                    }
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(AccountTransferConversionService, AccountTransferConversionService.make).pipe(
        Layer.provide([TransactionEntryRepository.layer, TransactionRepository.layer])
    );
}
