import {
    AccountRepository,
    convertToMicroUnits,
    SyncModeEnum,
    SyncRepository,
    TransactionEntryRepository,
    TransactionRepository
} from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { millisecondsInSecond } from 'date-fns/constants';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../enum/sync-transaction-type.enum';
import { isKnownSyncTransaction } from '../utils/is-known-sync-transaction.util';
import { matchUnconsolidatedTransferLegs } from '../utils/match-unconsolidated-transfer-legs.util';
import { resolveMatchableIban } from '../utils/resolve-matchable-iban.util';

import type { FileSyncServiceDefinitionInterface } from '../interface/file-sync-service-definition.interface';
import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncServiceDefinitionInterface } from '../interface/sync-service-definition.interface';
import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';
import type { ExternalSourceEnum, SyncEntityInterface } from '@budgie/contracts';

export class FileImportAccountService extends Context.Service<FileImportAccountService>()('@budgie/sync/FileImportAccountService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const accountArchiveService = yield* AccountArchiveService;
        const syncRepository = yield* SyncRepository;

        return {
            resolveIsDelivered: Effect.fn('FileImportAccountService.resolveIsDelivered')(function* (
                accountId: number,
                fileProvider: ExternalSourceEnum,
                sync: SyncEntityInterface | undefined
            ) {
                if (!isDefined(sync)) {
                    return () => false;
                }

                const { backwardSyncLimitAt, forwardSyncFromAt, mode, provider } = sync;
                if (provider === fileProvider) {
                    return (timeMs: number) =>
                        isDefined(backwardSyncLimitAt) &&
                        isDefined(forwardSyncFromAt) &&
                        timeMs >= backwardSyncLimitAt.getTime() &&
                        timeMs < forwardSyncFromAt.getTime();
                }

                if (mode === SyncModeEnum.BACKWARD) {
                    return (timeMs: number) => !isDefined(backwardSyncLimitAt) || timeMs >= backwardSyncLimitAt.getTime();
                }

                const earliestLiveAt = yield* transactionRepository.getEarliestTransactionTimeByAccountIdAndSource(accountId, provider);
                const earliestDeliveredAt = earliestLiveAt ?? forwardSyncFromAt;

                return (timeMs: number) =>
                    isDefined(earliestDeliveredAt) &&
                    timeMs >=
                        Date.UTC(earliestDeliveredAt.getUTCFullYear(), earliestDeliveredAt.getUTCMonth(), earliestDeliveredAt.getUTCDate());
            }),
            restoreArchivedAccount: Effect.fn('FileImportAccountService.restoreArchivedAccount')(function* (
                bankAccount: SyncAccountInterface,
                definition: Pick<SyncServiceDefinitionInterface, 'accountType' | 'provider'>
            ) {
                const accounts = yield* accountRepository.findIncludingArchivedByExternalKeys(
                    [bankAccount.id, resolveMatchableIban(bankAccount.iban)].filter(isDefined)
                );
                const archivedAccounts = yield* Effect.filter(accounts, account =>
                    isDefined(account.deletedAt) && !account.isExternal && account.type === definition.accountType
                        ? Effect.map(
                              isDefined(account.externalSource)
                                  ? Effect.succeed(account.externalSource)
                                  : Effect.map(syncRepository.getByAccountId(account.id), sync => sync?.provider),
                              provider => provider === definition.provider
                          )
                        : Effect.succeed(false)
                );
                const [archivedAccount] = archivedAccounts;
                if (archivedAccounts.length !== 1 || !isDefined(archivedAccount)) {
                    return false;
                }

                yield* accountArchiveService.restoreById(archivedAccount.id);
                yield* accountRepository.updateById(archivedAccount.id, { externalSource: definition.provider });

                return true;
            }),
            claimTransferLegDuplicates: Effect.fn('FileImportAccountService.claimTransferLegDuplicates')(function* (
                accountId: number,
                definition: Pick<FileSyncServiceDefinitionInterface, 'hasTransferLegEvidence' | 'provider'>,
                transactions: SyncTransactionInterface[],
                existingTransactionIdMap: ReadonlyMap<string, number>
            ) {
                const candidates = transactions.map(transaction => ({
                    transaction,
                    externalIds: [transaction.id, ...(transaction.legacyExternalIds ?? [])],
                    title: transaction.description,
                    isIncome: transaction.type === SyncTransactionTypeEnum.INCOME,
                    isKnown: isKnownSyncTransaction(transaction, existingTransactionIdMap),
                    operatedAt: new Date(transaction.time * millisecondsInSecond),
                    amounts: [
                        convertToMicroUnits(Math.abs(transaction.amount)),
                        convertToMicroUnits(Math.abs(transaction.amount) - transaction.feeAmount)
                    ]
                }));
                const { hasTransferLegEvidence } = definition;
                if (!isDefined(hasTransferLegEvidence) || candidates.every(({ isKnown }) => isKnown)) {
                    return new Set<SyncTransactionInterface>();
                }

                const legs = yield* transactionRepository.findUnconsolidatedTransferLegs(accountId, definition.provider);
                const matches = [...matchUnconsolidatedTransferLegs(candidates, legs, hasTransferLegEvidence)];

                yield* Effect.forEach(
                    matches.filter(([, leg]) => !isDefined(leg.entryExternalId)),
                    ([{ transaction }, leg]) => transactionEntryRepository.updateById(leg.entryId, { externalId: transaction.id }),
                    { discard: true }
                );

                return new Set(matches.map(([{ transaction }]) => transaction));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(FileImportAccountService, FileImportAccountService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            TransactionRepository.layer,
            TransactionEntryRepository.layer,
            AccountArchiveService.layer,
            SyncRepository.layer
        ])
    );
}
