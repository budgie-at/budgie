import { UnconsolidationService } from '@budgie/consolidation';
import {
    ACCOUNT_DELETED_TRANSFER_CATEGORY_ID,
    AccountRepository,
    BankIntegrationRepository,
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
        const bankIntegrationRepository = yield* BankIntegrationRepository;
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
            const seenIds = new Set<number>();
            const restoredTransactionIds = new Set<number>();
            const affectedAccountIds = new Set<number>();
            let canonicals = yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([id]);

            while (isNotEmptyArray(canonicals)) {
                const canonicalIds = canonicals.map(canonical => canonical.id);
                const consolidated = yield* transactionRepository.findByIdsWithRefundConsolidationHistory(canonicalIds);
                const debtAttachments = yield* debtEventRepository.findAttachmentsByTransactionIds(canonicalIds);

                for (const attachment of debtAttachments) {
                    affectedAccountIds.add(attachment.debtAccountId);
                }

                for (const transaction of consolidated) {
                    if (isDefined(transaction.fromAccountId)) {
                        affectedAccountIds.add(transaction.fromAccountId);
                    }
                    if (isDefined(transaction.toAccountId)) {
                        affectedAccountIds.add(transaction.toAccountId);
                    }
                    for (const entry of transaction.entries) {
                        affectedAccountIds.add(entry.accountId);
                        if (entry.accountId !== id && isDefined(entry.originalTransactionId)) {
                            restoredTransactionIds.add(entry.originalTransactionId);
                        }
                    }
                }

                for (const canonical of canonicals) {
                    seenIds.add(canonical.id);
                }

                yield* unconsolidateAll(canonicals);
                canonicals = (yield* transactionConsolidationRepository.findActiveAutoConsolidatedByAccountIds([id])).filter(
                    canonical => !seenIds.has(canonical.id)
                );
            }

            return {
                restoredTransactionIds: [...restoredTransactionIds],
                affectedAccountIds: [...affectedAccountIds]
            };
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
            const { affectedAccountIds } = yield* unconsolidateActiveAutoByAccountId(id);
            yield* archiveAccountRows(id);
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds(affectedAccountIds);
        });

        const markExternalByIdInTransaction = Effect.fnUntraced(function* (id: number) {
            const { restoredTransactionIds, affectedAccountIds } = yield* unconsolidateActiveAutoByAccountId(id);

            yield* accountRepository.updateById(id, { isExternal: true });

            const convertedTransactionIds = yield* accountTransferConversionService.convertAccountTransfers(id, null);

            yield* archiveAccountRows(id);
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds(affectedAccountIds);

            return [...new Set([...restoredTransactionIds, ...convertedTransactionIds])];
        });

        return {
            archiveById: Effect.fn('AccountArchiveService.archiveById')(function* (id: number) {
                yield* YIELD_TO_UI;

                yield* ledgerWorkload.runForeground(Db.transaction(archiveByIdInTransaction(id)));
            }),
            archiveByIntegrationId: Effect.fn('AccountArchiveService.archiveByIntegrationId')(function* (integrationId: number) {
                yield* YIELD_TO_UI;

                return yield* ledgerWorkload.runForeground(
                    Db.transaction(
                        Effect.gen(function* () {
                            const accounts = yield* accountRepository.findByIntegrationId(integrationId);

                            yield* Effect.forEach(accounts, account => archiveByIdInTransaction(account.id), { discard: true });

                            return accounts.map(account => account.id);
                        })
                    )
                );
            }),
            markExternalById: Effect.fn('AccountArchiveService.markExternalById')(function* (id: number) {
                yield* YIELD_TO_UI;

                return yield* ledgerWorkload.runForeground(Db.transaction(markExternalByIdInTransaction(id)));
            }),
            restoreById: Effect.fn('AccountArchiveService.restoreById')(function* (id: number) {
                yield* YIELD_TO_UI;

                yield* Db.transaction(
                    Effect.gen(function* () {
                        const account = yield* accountRepository.findByIdIncludingArchived(id);
                        const archivedAt = account?.deletedAt;
                        const restoredAccounts = yield* accountRepository.restoreById(id);

                        if (!isDefined(archivedAt) || !isNotEmptyArray(restoredAccounts)) {
                            return;
                        }

                        yield* debtEventRepository.restoreByAccountIds([id]);
                        yield* transactionEntryRepository.restoreByAccountIds([id], archivedAt);
                        yield* transactionRepository.restoreByAccountIds([id], archivedAt);
                        const restoredTransactions = yield* transactionRepository.findByAccountIdsWithEntries([id]);

                        yield* accountBalanceIncrementalService.updateBalancesByAccountIds([
                            id,
                            ...restoredTransactions.flatMap(transaction =>
                                [
                                    transaction.fromAccountId,
                                    transaction.toAccountId,
                                    ...transaction.entries.map(entry => entry.accountId)
                                ].filter(isDefined)
                            )
                        ]);
                    })
                );
            }),
            deleteById: Effect.fn('AccountArchiveService.deleteById')(
                function* (id: number) {
                    const integrationId = (yield* accountRepository.findByIdIncludingArchived(id))?.integrationId;

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
                    if (isDefined(integrationId)) {
                        yield* bankIntegrationRepository.deleteIfUnreferenced(integrationId);
                    }

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
            BankIntegrationRepository.layer,
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
