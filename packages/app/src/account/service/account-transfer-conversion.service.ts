import { TransactionEntryCreateEntityInterface, TransactionEntryTypeEnum, TransactionWithEntriesEntityInterface } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';

import type { DB } from '@budgie/contracts';

class AccountTransferConversionService {
    @Log(
        (accountId, tx) => `enter accountId=${accountId} hasTx=${String(isDefined(tx))}`,
        (result, accountId, tx) => `done accountId=${accountId} hasTx=${String(isDefined(tx))} hasResult=${String(isDefined(result))}`,
        (error, accountId, tx) => `throw accountId=${accountId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async convertAccountTransfers(accountId: number, tx: DB): Promise<void> {
        const transfers = await transactionRepository.findTransfersForConversion(accountId, tx);

        if (!isNotEmptyArray(transfers)) {
            return;
        }

        await transactionRepository.convertTransfersFromAccountToIncome(accountId, tx);
        await transactionRepository.convertTransfersToAccountToExpense(accountId, tx);

        const entriesToCreate = this.collectTransferEntries(transfers, accountId);
        const transactionIds = transfers.map(transaction => transaction.id);

        await transactionEntryRepository.deleteByTransactionIds(transactionIds, tx);

        if (isNotEmptyArray(entriesToCreate)) {
            await transactionEntryRepository.bulkCreate(entriesToCreate, tx);
        }
    }

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
