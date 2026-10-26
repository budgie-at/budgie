import { UnconsolidationService } from '@budgie/consolidation';
import {
    ACCOUNT_DELETED_TRANSFER_CATEGORY_ID,
    AccountRepository,
    DebtEventRepository,
    Db,
    SettingsRepository,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionConsolidationRepository,
    YIELD_TO_UI
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { LedgerWorkload } from '../../@generic/port/ledger-workload.port';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';

import { AccountBalanceIncrementalService } from './account-balance-incremental.service';
import { AccountTransferConversionService } from './account-transfer-conversion.service';

export class AccountArchiveService extends Context.Service<AccountArchiveService>()('@budgie/ledger/AccountArchiveService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const settingsRepository = yield* SettingsRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const accountTransferConversionService = yield* AccountTransferConversionService;
        const unconsolidationService = yield* UnconsolidationService;
        const ledgerWorkload = yield* LedgerWorkload;
        const unconsolidationBatchSize = 25;

        const unconsolidateAll = (canonicals: { readonly id: number }[]) =>
            processInputWithBatches(canonicals, unconsolidationBatchSize, batch =>
                Effect.forEach(batch, canonical => Db.transaction(unconsolidationService.unconsolidateById(canonical.id)), {
                    discard: true
                }).pipe(Effect.as(null))
            );

        const unconsolidateActiveAutoByAccountId = Effect.fn('AccountArchiveService.unconsolidateActiveAutoByAccountId')(function* (
            id: number
        ) {
            yield* unconsolidateAll(yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([id]));
        });

        const archiveAccountRows = Effect.fnUntraced(function* (id: number) {
            yield* accountRepository.archiveById(id);
            yield* debtEventRepository.archiveByAccountIds([id]);
            yield* transactionEntryRepository.archiveByAccountIds([id]);
            yield* transactionRepository.archiveByAccountIds([id]);

            const settings = yield* settingsRepository.getSettings();
            if (settings.defaultAccountId === id) {
                yield* settingsRepository.update({ defaultAccountId: null });
            }
        });

        const archiveByIdInTransaction = Effect.fn('AccountArchiveService.archiveByIdInTransaction')(function* (id: number) {
            yield* unconsolidateActiveAutoByAccountId(id);
            yield* archiveAccountRows(id);
        });

        const markExternalByIdInTransaction = Effect.fnUntraced(function* (id: number) {
            const canonicals = yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([id]);
            const consolidated = yield* transactionRepository.findByIdsWithRefundConsolidationHistory(
                canonicals.map(canonical => canonical.id)
            );
            const restoredTransactionIds = consolidated
                .flatMap(transaction => transaction.entries)
                .filter(entry => entry.accountId !== id)
                .map(entry => entry.originalTransactionId)
                .filter(isDefined);

            yield* unconsolidateAll(canonicals);
            yield* accountRepository.updateById(id, { isExternal: true });

            const convertedTransactionIds = yield* accountTransferConversionService.convertAccountTransfers(id, null);

            yield* archiveAccountRows(id);

            return [...new Set([...restoredTransactionIds, ...convertedTransactionIds])];
        });

        return {
            archiveById: Effect.fn('AccountArchiveService.archiveById')(function* (id: number) {
                yield* YIELD_TO_UI;

                yield* ledgerWorkload.runForeground(Db.transaction(archiveByIdInTransaction(id)));
            }),
            markExternalById: Effect.fn('AccountArchiveService.markExternalById')(function* (id: number) {
                yield* YIELD_TO_UI;

                return yield* ledgerWorkload.runForeground(Db.transaction(markExternalByIdInTransaction(id)));
            }),
            restoreById: Effect.fn('AccountArchiveService.restoreById')(function* (id: number) {
                yield* YIELD_TO_UI;

                yield* Db.transaction(
                    Effect.gen(function* () {
                        if (!isNotEmptyArray(yield* accountRepository.restoreById(id))) {
                            return;
                        }

                        yield* debtEventRepository.restoreByAccountIds([id]);
                        yield* transactionEntryRepository.restoreByAccountIds([id]);
                        yield* transactionRepository.restoreByAccountIds([id]);
                    })
                );
            }),
            deleteById: Effect.fn('AccountArchiveService.deleteById')(
                function* (id: number) {
                    yield* unconsolidateActiveAutoByAccountId(id);
                    yield* accountTransferConversionService.convertAccountTransfers(id, ACCOUNT_DELETED_TRANSFER_CATEGORY_ID);
                    yield* transactionRepository.detachTransfersFromAccount(id);
                    yield* debtEventRepository.deleteByAccountId(id);
                    yield* transactionEntryRepository.deleteByAccountId(id);
                    yield* transactionRepository.deleteByAccountId(id);

                    const settings = yield* settingsRepository.getSettings();
                    if (settings.defaultAccountId === id) {
                        yield* settingsRepository.update({ defaultAccountId: null });
                    }

                    yield* accountRepository.deleteById(id);
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                },
                effect => Db.transaction(effect)
            ),
            archiveByIdInTransaction
        };
    })
}) {
    static readonly layer = Layer.effect(AccountArchiveService, AccountArchiveService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
            SettingsRepository.layer,
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            AccountBalanceIncrementalService.layer,
            AccountTransferConversionService.layer,
            UnconsolidationService.layer
        ])
    );
}
