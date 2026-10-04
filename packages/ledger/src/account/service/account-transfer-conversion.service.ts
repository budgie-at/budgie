import {
    ACCOUNT_DELETED_TRANSFER_CATEGORY_ID,
    CategorySourceEnum,
    TransactionEntryCreateEntityInterface,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

export class AccountTransferConversionService extends Context.Service<AccountTransferConversionService>()(
    '@budgie/ledger/AccountTransferConversionService',
    {
        make: Effect.gen(function* () {
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionRepository = yield* TransactionRepository;

            const collectSurvivingEntries = (
                transfers: TransactionWithEntriesEntityInterface[],
                accountId: number
            ): TransactionEntryCreateEntityInterface[] =>
                transfers.flatMap(transfer =>
                    transfer.entries
                        .filter(entry => entry.accountId !== accountId)
                        .map(entry =>
                            entry.type === TransactionEntryTypeEnum.FEE
                                ? entry
                                : { ...entry, categoryId: ACCOUNT_DELETED_TRANSFER_CATEGORY_ID, categorySource: CategorySourceEnum.USER }
                        )
                );

            return {
                convertAccountTransfers: Effect.fn('AccountTransferConversionService.convertAccountTransfers')(function* (
                    accountId: number
                ) {
                    const transfers = yield* transactionRepository.findTransfersForConversion(accountId);

                    if (!isNotEmptyArray(transfers)) {
                        return;
                    }

                    const orphanedTransferIds = transfers
                        .filter(transfer => transfer.entries.every(entry => entry.accountId === accountId))
                        .map(transfer => transfer.id);

                    yield* transactionRepository.archiveByIds(orphanedTransferIds);
                    yield* transactionRepository.convertTransfersFromAccountToIncome(accountId);
                    yield* transactionRepository.convertTransfersToAccountToExpense(accountId);

                    const entriesToCreate = collectSurvivingEntries(transfers, accountId);

                    yield* transactionEntryRepository.deleteLedgerByTransactionIds(transfers.map(transaction => transaction.id));

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
