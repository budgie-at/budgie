import { UnconsolidationService } from '@budgie/consolidation';
import {
    Db,
    TransactionConsolidationRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryRepository,
    TransactionRepository
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { processInputWithBatches } from '../../@generic/util/process-input-with-batches.util';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { ImportedTransactionRefreshModeEnum } from '../enum/imported-transaction-refresh-mode.enum';
import { RefreshedImportedEntriesStatusEnum } from '../enum/refreshed-imported-entries-status.enum';
import { ImportedBatchPartitionInterface } from '../interface/imported-batch-partition.interface';
import { ImportedUpdateParamInterface } from '../interface/imported-update-param.interface';
import { getEntryAccountIds } from '../util/get-entry-account-ids.util';
import { stampForDeferredEmbedding } from '../util/stamp-for-deferred-embedding.util';

import { ImportedBatchNormalizerService } from './imported-batch-normalizer.service';
import { RefreshedImportedEntriesService } from './refreshed-imported-entries.service';
import { TransactionBatchCreateService } from './transaction-batch-create.service';
import { TransactionDepositSafetyService } from './transaction-deposit-safety.service';

import type { ImportedBatchPreparationInterface } from '../interface/imported-batch-preparation.interface';
import type { ImportedUpsertResultInterface } from '../interface/imported-upsert-result.interface';
import type { TransactionImportOptionsInterface } from '../interface/transaction-import-options.interface';
import type { TransactionCreateInputInterface, TransactionEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class TransactionImportService extends Context.Service<TransactionImportService>()('@budgie/ledger/TransactionImportService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const unconsolidationService = yield* UnconsolidationService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const importedBatchNormalizerService = yield* ImportedBatchNormalizerService;
        const refreshedImportedEntriesService = yield* RefreshedImportedEntriesService;
        const transactionBatchCreateService = yield* TransactionBatchCreateService;
        const transactionDepositSafetyService = yield* TransactionDepositSafetyService;

        const mapExternalIdAlias = (
            input: TransactionCreateInputInterface,
            importExternalIdMap: Map<string, number>,
            existingTransactionIdMap: Map<string, number>
        ): void => {
            const { externalId } = input;

            if (!isDefined(externalId)) {
                return;
            }

            const externalIdAlias = input.externalIdAliases?.find(item => existingTransactionIdMap.has(item));

            if (!isDefined(externalIdAlias)) {
                return;
            }

            const transactionId = existingTransactionIdMap.get(externalIdAlias);

            if (isDefined(transactionId)) {
                importExternalIdMap.set(externalId, transactionId);
            }
        };

        const buildImportExternalIdMap = (
            inputs: readonly TransactionCreateInputInterface[],
            existingTransactionIdMap: Map<string, number>
        ): Map<string, number> => {
            const importExternalIdMap = new Map(existingTransactionIdMap);

            for (const input of inputs) {
                const { externalId } = input;
                const shouldCheckExternalIdAliases = isDefined(externalId) && !importExternalIdMap.has(externalId);

                if (shouldCheckExternalIdAliases) {
                    mapExternalIdAlias(input, importExternalIdMap, existingTransactionIdMap);
                }
            }

            return importExternalIdMap;
        };

        const buildImportedUpdateParam = (
            input: TransactionCreateInputInterface,
            existingTransactionIdMap: Map<string, number>
        ): ImportedUpdateParamInterface | null => {
            const { externalId } = input;

            if (!isDefined(externalId)) {
                return null;
            }

            const transactionId = existingTransactionIdMap.get(externalId);

            if (!isDefined(transactionId)) {
                return null;
            }

            return { transactionId, input };
        };

        const partitionImportedBatch = (
            batch: TransactionCreateInputInterface[],
            existingTransactionIdMap: Map<string, number>
        ): ImportedBatchPartitionInterface => {
            const newInputs: TransactionCreateInputInterface[] = [];
            const updateParams: ImportedUpdateParamInterface[] = [];
            const resultsOrder: Array<{ kind: 'create' | 'update'; index: number }> = [];

            for (const input of batch) {
                const importedUpdateParam = buildImportedUpdateParam(input, existingTransactionIdMap);

                if (isDefined(importedUpdateParam)) {
                    resultsOrder.push({ kind: 'update', index: updateParams.length });
                    updateParams.push(importedUpdateParam);
                } else {
                    resultsOrder.push({ kind: 'create', index: newInputs.length });
                    newInputs.push(input);
                }
            }

            return { newInputs, updateParams, resultsOrder };
        };

        const prepareImportedInputs = (
            inputs: TransactionCreateInputInterface[],
            existingTransactionIdMap: Map<string, number>
        ): ImportedBatchPreparationInterface => {
            const transactionInputs = importedBatchNormalizerService.normalize(inputs);
            const externalIdMap = buildImportExternalIdMap(transactionInputs, existingTransactionIdMap);

            return { externalIdMap, transactionInputs };
        };

        const getTransactionsMap = Effect.fnUntraced(function* (transactionIds: number[]) {
            const transactions = yield* transactionRepository.findByIds(transactionIds);

            return new Map(
                transactions.map((transaction): [number, TransactionWithEntriesEntityInterface] => [transaction.id, transaction])
            );
        });

        const getConsolidationParentsMap = (
            existingTransactions: readonly TransactionWithEntriesEntityInterface[],
            liveEntryTransactionIds: ReadonlySet<number>
        ) =>
            getTransactionsMap(
                existingTransactions
                    .filter(transaction => !liveEntryTransactionIds.has(transaction.id))
                    .map(transaction => transaction.consolidationParentTransactionId)
                    .filter(isDefined)
            );

        const resolveRefreshMode = (
            existingTransaction: TransactionWithEntriesEntityInterface,
            importFingerprint: string,
            liveEntryTransactionIds: ReadonlySet<number>,
            consolidationParentsMap: Map<number, TransactionWithEntriesEntityInterface>
        ): ImportedTransactionRefreshModeEnum => {
            const { consolidationParentTransactionId, consolidationType } = existingTransaction;

            if (!liveEntryTransactionIds.has(existingTransaction.id)) {
                const isRefundSource =
                    isDefined(consolidationParentTransactionId) &&
                    consolidationParentsMap.get(consolidationParentTransactionId)?.consolidationType ===
                        TransactionConsolidationTypeEnum.REFUND;

                return !isDefined(consolidationParentTransactionId) || isRefundSource
                    ? ImportedTransactionRefreshModeEnum.REFILL
                    : ImportedTransactionRefreshModeEnum.KEEP_APP_VALUES;
            }

            const isBankChange =
                isDefined(existingTransaction.importFingerprint) && existingTransaction.importFingerprint !== importFingerprint;
            const isConsolidated = isDefined(consolidationType) || isDefined(consolidationParentTransactionId);

            return isBankChange && !isConsolidated
                ? ImportedTransactionRefreshModeEnum.APPLY_BANK_CHANGE
                : ImportedTransactionRefreshModeEnum.KEEP_APP_VALUES;
        };

        const detachFromStaleRefund = Effect.fnUntraced(function* (consolidationParentId: number, sourceTransactionIds: number[]) {
            if (yield* transactionEntryRepository.hasMovedSourceEntries([consolidationParentId])) {
                yield* transactionConsolidationRepository.detachFromConsolidation(sourceTransactionIds);

                return;
            }

            yield* unconsolidationService.unconsolidateById(consolidationParentId);
        });

        const detachRefilledSources = Effect.fnUntraced(function* (refilledTransactions: readonly TransactionEntityInterface[]) {
            const sourceIdsByParentId = new Map<number, number[]>();

            for (const { id, consolidationParentTransactionId } of refilledTransactions) {
                if (isDefined(consolidationParentTransactionId)) {
                    sourceIdsByParentId.set(consolidationParentTransactionId, [
                        ...(sourceIdsByParentId.get(consolidationParentTransactionId) ?? []),
                        id
                    ]);
                }
            }

            yield* Effect.forEach(sourceIdsByParentId, ([consolidationParentId, sourceTransactionIds]) =>
                detachFromStaleRefund(consolidationParentId, sourceTransactionIds)
            );
        });

        const refreshImportedTransactionEntries = Effect.fnUntraced(function* (
            input: TransactionCreateInputInterface,
            existingTransaction: TransactionWithEntriesEntityInterface
        ) {
            const transactionId = existingTransaction.id;
            const refreshedEntriesResult = yield* refreshedImportedEntriesService.build({
                existingEntries: existingTransaction.entries,
                inputEntries: input.entries,
                transactionId,
                input
            });

            if (
                refreshedEntriesResult.status !== RefreshedImportedEntriesStatusEnum.REFRESHED ||
                !isDefined(refreshedEntriesResult.entries)
            ) {
                return;
            }

            yield* transactionEntryRepository.deleteLedgerByTransactionId(transactionId);
            yield* transactionEntryRepository.bulkCreate([...refreshedEntriesResult.entries]);
        });

        const replaceImportedTransactionEntries = Effect.fnUntraced(function* (
            input: TransactionCreateInputInterface,
            existingTransaction: TransactionWithEntriesEntityInterface
        ) {
            const transactionId = existingTransaction.id;
            const entries = yield* refreshedImportedEntriesService.rebuild(transactionId, input, existingTransaction.entries);

            yield* transactionEntryRepository.deleteLedgerByTransactionId(transactionId);
            yield* transactionEntryRepository.bulkCreate(entries);
        });

        const writeImportedTransactionEntries = (
            refreshMode: ImportedTransactionRefreshModeEnum,
            input: TransactionCreateInputInterface,
            existingTransaction: TransactionWithEntriesEntityInterface
        ) =>
            refreshMode === ImportedTransactionRefreshModeEnum.KEEP_APP_VALUES
                ? refreshImportedTransactionEntries(input, existingTransaction)
                : replaceImportedTransactionEntries(input, existingTransaction);

        const updateImportedTransaction = Effect.fnUntraced(function* (
            input: TransactionCreateInputInterface,
            existingTransaction: TransactionWithEntriesEntityInterface,
            refreshMode: ImportedTransactionRefreshModeEnum
        ) {
            const importFingerprint = importedBatchNormalizerService.buildImportFingerprint(input);
            const shouldKeepAppValues = refreshMode === ImportedTransactionRefreshModeEnum.KEEP_APP_VALUES;
            const updated = yield* transactionRepository.updateById(existingTransaction.id, {
                title: input.title,
                comment: isNotEmptyString(existingTransaction.comment) ? existingTransaction.comment : input.comment,
                operatedAt: input.operatedAt,
                externalId: input.externalId,
                externalSource: input.externalSource,
                importFingerprint:
                    shouldKeepAppValues && isDefined(existingTransaction.importFingerprint)
                        ? existingTransaction.importFingerprint
                        : importFingerprint,
                ...(!shouldKeepAppValues && {
                    type: input.type,
                    fromAccountId: input.fromAccountId,
                    toAccountId: input.toAccountId,
                    exchangeRate: input.exchangeRate
                })
            });

            yield* writeImportedTransactionEntries(refreshMode, input, existingTransaction);

            return updated;
        });

        const updateImportedTransactions = Effect.fnUntraced(function* (
            updateParams: readonly ImportedUpdateParamInterface[],
            refilledTransactions: TransactionEntityInterface[]
        ) {
            const existingTransactionsMap = yield* getTransactionsMap(updateParams.map(({ transactionId }) => transactionId));
            const existingTransactions = [...existingTransactionsMap.values()];

            yield* transactionDepositSafetyService.assertNoDepositExpenseTransactions(existingTransactions);

            const liveEntryTransactionIds = yield* transactionEntryRepository.findTransactionIdsWithLiveEntries([
                ...existingTransactionsMap.keys()
            ]);
            const consolidationParentsMap = yield* getConsolidationParentsMap(existingTransactions, liveEntryTransactionIds);
            const refreshParams = updateParams.flatMap(({ transactionId, input }) => {
                const existingTransaction = existingTransactionsMap.get(transactionId);

                return isDefined(existingTransaction) ? [{ input, existingTransaction }] : [];
            });
            const refreshModes = refreshParams.map(({ input, existingTransaction }) =>
                resolveRefreshMode(
                    existingTransaction,
                    importedBatchNormalizerService.buildImportFingerprint(input),
                    liveEntryTransactionIds,
                    consolidationParentsMap
                )
            );
            const batchRefilledTransactions = refreshParams
                .filter((_param, index) => refreshModes[index] === ImportedTransactionRefreshModeEnum.REFILL)
                .map(({ existingTransaction }) => existingTransaction);

            yield* detachRefilledSources(batchRefilledTransactions);

            const updatedTransactions = yield* Effect.forEach(refreshParams, ({ input, existingTransaction }, index) =>
                updateImportedTransaction(input, existingTransaction, refreshModes[index])
            );

            refilledTransactions.push(
                ...updatedTransactions.filter((_transaction, index) => refreshModes[index] === ImportedTransactionRefreshModeEnum.REFILL)
            );

            return new Map(updatedTransactions.map((transaction): [number, TransactionEntityInterface] => [transaction.id, transaction]));
        });

        const processImportedBatchInner = Effect.fnUntraced(function* (
            batch: TransactionCreateInputInterface[],
            existingTransactionIdMap: Map<string, number>,
            refilledTransactions: TransactionEntityInterface[]
        ) {
            const partition = partitionImportedBatch(batch, existingTransactionIdMap);

            yield* transactionDepositSafetyService.assertNoDepositExpenseInputs(partition.newInputs);

            const updatedTransactionsMap = yield* updateImportedTransactions(partition.updateParams, refilledTransactions);
            const createdTransactions = yield* transactionBatchCreateService.create(
                partition.newInputs.map(input => ({
                    ...input,
                    importFingerprint: importedBatchNormalizerService.buildImportFingerprint(input)
                }))
            );

            return partition.resultsOrder.flatMap(result => {
                if (result.kind === 'create') {
                    return [createdTransactions[result.index]];
                }

                const updatedTransaction = updatedTransactionsMap.get(partition.updateParams[result.index].transactionId);

                return isDefined(updatedTransaction) ? [updatedTransaction] : [];
            });
        });

        const bulkUpsertPreparedImported = Effect.fn('TransactionImportService.bulkUpsertPreparedImported')(
            function* (prepared: ImportedBatchPreparationInterface, options: TransactionImportOptionsInterface = {}) {
                const batchSize = options.batchSize ?? TRANSACTION_BATCH_SIZE;
                const shouldUpdateBalances = options.shouldUpdateBalances ?? true;
                const refilledTransactions: TransactionEntityInterface[] = [];

                if (!isNotEmptyArray(prepared.transactionInputs)) {
                    return { transactions: [], refilledTransactions } satisfies ImportedUpsertResultInterface;
                }

                const stampedInputs = stampForDeferredEmbedding(prepared.transactionInputs);

                const transactions = yield* processInputWithBatches(stampedInputs, batchSize, batch =>
                    processImportedBatchInner(batch, prepared.externalIdMap, refilledTransactions)
                );

                if (shouldUpdateBalances && isNotEmptyArray(transactions)) {
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds(getEntryAccountIds(stampedInputs));
                }

                return { transactions, refilledTransactions } satisfies ImportedUpsertResultInterface;
            },
            effect => Db.transaction(effect)
        );

        return {
            prepareImportedInputs,
            bulkUpsertPreparedImported,
            bulkUpsertImported: Effect.fn('TransactionImportService.bulkUpsertImported')(
                function* (
                    inputs: TransactionCreateInputInterface[],
                    existingTransactionIdMap: Map<string, number>,
                    options: TransactionImportOptionsInterface = {}
                ) {
                    if (!isNotEmptyArray(inputs)) {
                        return [];
                    }

                    const { transactions } = yield* bulkUpsertPreparedImported(
                        prepareImportedInputs(inputs, existingTransactionIdMap),
                        options
                    );

                    return transactions;
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(TransactionImportService, TransactionImportService.make).pipe(
        Layer.provide([
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            UnconsolidationService.layer,
            AccountBalanceIncrementalService.layer,
            ImportedBatchNormalizerService.layer,
            RefreshedImportedEntriesService.layer,
            TransactionBatchCreateService.layer,
            TransactionDepositSafetyService.layer
        ])
    );
}
