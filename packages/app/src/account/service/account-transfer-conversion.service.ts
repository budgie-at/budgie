import { TransactionEntryCreateEntityInterface, TransactionEntryTypeEnum, TransactionWithEntriesEntityInterface } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';

class AccountTransferConversionService {
    readonly convertAccountTransfers = Effect.fn('AccountTransferConversionService.convertAccountTransfers')(function* (
        this: AccountTransferConversionService,
        accountId: number
    ) {
        const transfers = yield* transactionRepository.findTransfersForConversion(accountId);

        if (!isNotEmptyArray(transfers)) {
            return;
        }

        yield* transactionRepository.convertTransfersFromAccountToIncome(accountId);
        yield* transactionRepository.convertTransfersToAccountToExpense(accountId);

        const entriesToCreate = this.collectTransferEntries(transfers, accountId);
        const transactionIds = transfers.map(transaction => transaction.id);

        yield* transactionEntryRepository.deleteByTransactionIds(transactionIds);

        if (isNotEmptyArray(entriesToCreate)) {
            yield* transactionEntryRepository.bulkCreate(entriesToCreate);
        }
    });

    private collectTransferEntries(transfers: TransactionWithEntriesEntityInterface[], accountId: number) {
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
    }
}

export const accountTransferConversionService = new AccountTransferConversionService();
