import { AccountRepository, convertToMicroUnits, SyncModeEnum, TransactionRepository } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { millisecondsInSecond } from 'date-fns/constants';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../enum/sync-transaction-type.enum';
import { matchUnconsolidatedTransferLegs } from '../utils/match-unconsolidated-transfer-legs.util';
import { resolveMatchableIban } from '../utils/resolve-matchable-iban.util';

import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncServiceDefinitionInterface } from '../interface/sync-service-definition.interface';
import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';
import type { ExternalSourceEnum, SyncEntityInterface } from '@budgie/contracts';

export class FileImportAccountService extends Context.Service<FileImportAccountService>()('@budgie/sync/FileImportAccountService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountArchiveService = yield* AccountArchiveService;

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
                const archivedAccounts = (yield* accountRepository.findIncludingArchivedByExternalKeys(
                    [bankAccount.id, resolveMatchableIban(bankAccount.iban)].filter(isDefined)
                )).filter(
                    account =>
                        isDefined(account.deletedAt) &&
                        !account.isExternal &&
                        account.type === definition.accountType &&
                        account.externalSource === definition.provider
                );
                const [archivedAccount] = archivedAccounts;
                if (archivedAccounts.length !== 1 || !isDefined(archivedAccount)) {
                    return false;
                }

                yield* accountArchiveService.restoreById(archivedAccount.id);

                return true;
            }),
            findTransferLegDuplicates: Effect.fn('FileImportAccountService.findTransferLegDuplicates')(function* (
                accountId: number,
                provider: ExternalSourceEnum,
                newTransactions: SyncTransactionInterface[]
            ) {
                if (!isNotEmptyArray(newTransactions)) {
                    return new Set<SyncTransactionInterface>();
                }

                const legs = yield* transactionRepository.findUnconsolidatedTransferLegs(accountId, provider);
                const candidates = newTransactions.map(transaction => ({
                    transaction,
                    isIncome: transaction.type === SyncTransactionTypeEnum.INCOME,
                    operatedAt: new Date(transaction.time * millisecondsInSecond),
                    amount: convertToMicroUnits(Math.abs(transaction.amount))
                }));

                return new Set([...matchUnconsolidatedTransferLegs(candidates, legs)].map(({ transaction }) => transaction));
            })
        };
    })
}) {
    static readonly layer = Layer.effect(FileImportAccountService, FileImportAccountService.make).pipe(
        Layer.provide([AccountRepository.layer, TransactionRepository.layer, AccountArchiveService.layer])
    );
}
