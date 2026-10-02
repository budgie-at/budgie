import { Db, TransactionEntryRepository, TransactionRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { ImportedBatchPartitionInterface } from '../interface/imported-batch-partition.interface';
import { ImportedUpdateParamInterface } from '../interface/imported-update-param.interface';
import { RefreshedImportedEntriesStatusEnum } from '../type/refreshed-imported-entries-status.enum';
import { getEntryAccountIds } from '../utils/get-entry-account-ids.util';
import { stampForDeferredEmbedding } from '../utils/stamp-for-deferred-embedding.util';

import { ImportedBatchNormalizerService } from './imported-batch-normalizer.service';
import { RefreshedImportedEntriesService } from './refreshed-imported-entries.service';
import { TransactionBatchCreateService } from './transaction-batch-create.service';
import { TransactionDepositSafetyService } from './transaction-deposit-safety.service';

import type { ImportedBatchPreparationInterface } from '../interface/imported-batch-preparation.interface';
import type { TransactionImportOptionsInterface } from '../interface/transaction-import-options.interface';
import type { TransactionCreateInputInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class TransactionImportService extends Context.Service<TransactionImportService>()('@budgie/app/TransactionImportService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
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

        const getExistingTransactionsMap = Effect.fnUntraced(function* (updateParams: readonly ImportedUpdateParamInterface[]) {
            const transactionIds = updateParams.map(({ transactionId }) => transactionId);
            const existingTransactions = yield* transactionRepository.findByIds(transactionIds);

            return new Map(
                existingTransactions.map((transaction): [number, TransactionWithEntriesEntityInterface] => [transaction.id, transaction])
            );
        });

        const refreshImportedTransactionEntries = Effect.fnUntraced(function* (
            transactionId: number,
            input: TransactionCreateInputInterface,
            existingTransaction: TransactionWithEntriesEntityInterface | null
        ) {
            if (!isDefined(existingTransaction)) {
                return;
            }

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

            yield* transactionEntryRepository.deleteByTransactionId(transactionId);
            yield* transactionEntryRepository.bulkCreate([...refreshedEntriesResult.entries]);
        });

        const updateImportedTransaction = Effect.fnUntraced(function* (
            transactionId: number,
            input: TransactionCreateInputInterface,
            existingTransaction: TransactionWithEntriesEntityInterface | null
        ) {
            const comment =
                isDefined(existingTransaction) && isNotEmptyString(existingTransaction.comment)
                    ? existingTransaction.comment
                    : input.comment;
            const updated = yield* transactionRepository.updateById(transactionId, {
                title: input.title,
                comment,
                operatedAt: input.operatedAt,
                externalId: input.externalId,
                externalSource: input.externalSource
            });

            yield* refreshImportedTransactionEntries(transactionId, input, existingTransaction);

            return updated;
        });

        const processImportedBatchInner = Effect.fnUntraced(function* (
            batch: TransactionCreateInputInterface[],
            existingTransactionIdMap: Map<string, number>
        ) {
            const partition = partitionImportedBatch(batch, existingTransactionIdMap);
            const existingTransactionsMap = yield* getExistingTransactionsMap(partition.updateParams);

            yield* transactionDepositSafetyService.assertNoDepositExpenseInputs(partition.newInputs);
            yield* transactionDepositSafetyService.assertNoDepositExpenseTransactions([...existingTransactionsMap.values()]);

            const createdTransactions = yield* transactionBatchCreateService.create(partition.newInputs);
            const updatedTransactions = yield* Effect.forEach(
                partition.updateParams,
                params =>
                    updateImportedTransaction(
                        params.transactionId,
                        params.input,
                        existingTransactionsMap.get(params.transactionId) ?? null
                    ),
                { concurrency: 'unbounded' }
            );

            return partition.resultsOrder.map(result =>
                result.kind === 'create' ? createdTransactions[result.index] : updatedTransactions[result.index]
            );
        });

        const bulkUpsertPreparedImported = Effect.fn('TransactionImportService.bulkUpsertPreparedImported')(
            function* (prepared: ImportedBatchPreparationInterface, options: TransactionImportOptionsInterface = {}) {
                const batchSize = options.batchSize ?? TRANSACTION_BATCH_SIZE;
                const shouldUpdateBalances = options.shouldUpdateBalances ?? true;

                if (!isNotEmptyArray(prepared.transactionInputs)) {
                    return [];
                }

                const stampedInputs = stampForDeferredEmbedding(prepared.transactionInputs);

                const transactions = yield* processInputWithBatches(stampedInputs, batchSize, batch =>
                    processImportedBatchInner(batch, prepared.externalIdMap)
                );

                if (shouldUpdateBalances && isNotEmptyArray(transactions)) {
                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds(getEntryAccountIds(stampedInputs));
                }

                return transactions;
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

                    return yield* bulkUpsertPreparedImported(prepareImportedInputs(inputs, existingTransactionIdMap), options);
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
            AccountBalanceIncrementalService.layer,
            ImportedBatchNormalizerService.layer,
            RefreshedImportedEntriesService.layer,
            TransactionBatchCreateService.layer,
            TransactionDepositSafetyService.layer
        ])
    );
}
