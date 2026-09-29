import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { ImportedBatchPartitionInterface } from '../interface/imported-batch-partition.interface';
import { ImportedUpdateParamInterface } from '../interface/imported-update-param.interface';
import { RefreshedImportedEntriesStatusEnum } from '../type/refreshed-imported-entries-status.enum';
import { stampForDeferredEmbedding } from '../utils/stamp-for-deferred-embedding.util';

import { importedBatchNormalizerService } from './imported-batch-normalizer.service';
import { refreshedImportedEntriesService } from './refreshed-imported-entries.service';
import { transactionBatchCreateService } from './transaction-batch-create.service';
import { transactionDepositSafetyService } from './transaction-deposit-safety.service';

import type { ImportedBatchPreparationInterface } from '../interface/imported-batch-preparation.interface';
import type { TransactionImportOptionsInterface } from '../interface/transaction-import-options.interface';
import type { TransactionCreateInputInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

class TransactionImportService {
    readonly bulkUpsertImported = Effect.fn('TransactionImportService.bulkUpsertImported')(
        function* (
            this: TransactionImportService,
            inputs: TransactionCreateInputInterface[],
            existingTransactionIdMap: Map<string, number>,
            options: TransactionImportOptionsInterface = {}
        ) {
            if (!isNotEmptyArray(inputs)) {
                return [];
            }

            const prepared = this.prepareImportedInputs(inputs, existingTransactionIdMap);

            return yield* this.bulkUpsertPreparedImported(prepared, options);
        },
        effect => Db.transaction(effect)
    );

    readonly bulkUpsertPreparedImported = Effect.fn('TransactionImportService.bulkUpsertPreparedImported')(
        function* (
            this: TransactionImportService,
            prepared: ImportedBatchPreparationInterface,
            options: TransactionImportOptionsInterface = {}
        ) {
            const batchSize = options.batchSize ?? TRANSACTION_BATCH_SIZE;
            const shouldUpdateBalances = options.shouldUpdateBalances ?? true;

            if (!isNotEmptyArray(prepared.transactionInputs)) {
                return [];
            }

            const stampedInputs = stampForDeferredEmbedding(prepared.transactionInputs);

            const transactions = yield* processInputWithBatches(stampedInputs, batchSize, batch =>
                this.processImportedBatchInner(batch, prepared.externalIdMap)
            );

            if (shouldUpdateBalances && isNotEmptyArray(transactions)) {
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs(stampedInputs));
            }

            return transactions;
        },
        effect => Db.transaction(effect)
    );

    private readonly processImportedBatchInner = Effect.fnUntraced(function* (
        this: TransactionImportService,
        batch: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>
    ) {
        const partition = this.partitionImportedBatch(batch, existingTransactionIdMap);
        const existingTransactionsMap = yield* this.getExistingTransactionsMap(partition.updateParams);

        yield* transactionDepositSafetyService.assertNoDepositExpenseInputs(partition.newInputs);
        yield* transactionDepositSafetyService.assertNoDepositExpenseTransactions([...existingTransactionsMap.values()]);

        const createdTransactions = yield* transactionBatchCreateService.create(partition.newInputs);
        const updatedTransactions = yield* Effect.forEach(
            partition.updateParams,
            params =>
                this.updateImportedTransaction(
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

    private readonly updateImportedTransaction = Effect.fnUntraced(function* (
        this: TransactionImportService,
        transactionId: number,
        input: TransactionCreateInputInterface,
        existingTransaction: TransactionWithEntriesEntityInterface | null
    ) {
        const comment =
            isDefined(existingTransaction) && isNotEmptyString(existingTransaction.comment) ? existingTransaction.comment : input.comment;
        const updated = yield* transactionRepository.updateById(transactionId, {
            title: input.title,
            comment,
            operatedAt: input.operatedAt,
            externalId: input.externalId,
            externalSource: input.externalSource
        });

        yield* this.refreshImportedTransactionEntries(transactionId, input, existingTransaction);

        return updated;
    });

    private readonly refreshImportedTransactionEntries = Effect.fnUntraced(function* (
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

        if (refreshedEntriesResult.status !== RefreshedImportedEntriesStatusEnum.REFRESHED || !isDefined(refreshedEntriesResult.entries)) {
            return;
        }

        yield* transactionEntryRepository.deleteByTransactionId(transactionId);
        yield* transactionEntryRepository.bulkCreate([...refreshedEntriesResult.entries]);
    });

    private readonly getExistingTransactionsMap = Effect.fnUntraced(function* (updateParams: readonly ImportedUpdateParamInterface[]) {
        const transactionIds = updateParams.map(({ transactionId }) => transactionId);
        const existingTransactions = yield* transactionRepository.findByIds(transactionIds);

        return new Map(
            existingTransactions.map((transaction): [number, TransactionWithEntriesEntityInterface] => [transaction.id, transaction])
        );
    });

    prepareImportedInputs(
        inputs: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>
    ): ImportedBatchPreparationInterface {
        const transactionInputs = importedBatchNormalizerService.normalize(inputs);
        const externalIdMap = this.buildImportExternalIdMap(transactionInputs, existingTransactionIdMap);

        return { externalIdMap, transactionInputs };
    }

    private buildImportExternalIdMap(
        inputs: readonly TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>
    ): Map<string, number> {
        const importExternalIdMap = new Map(existingTransactionIdMap);

        for (const input of inputs) {
            const { externalId } = input;
            const shouldCheckExternalIdAliases = isDefined(externalId) && !importExternalIdMap.has(externalId);

            if (shouldCheckExternalIdAliases) {
                this.mapExternalIdAlias(input, importExternalIdMap, existingTransactionIdMap);
            }
        }

        return importExternalIdMap;
    }

    private mapExternalIdAlias(
        input: TransactionCreateInputInterface,
        importExternalIdMap: Map<string, number>,
        existingTransactionIdMap: Map<string, number>
    ): void {
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
    }

    private partitionImportedBatch(
        batch: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>
    ): ImportedBatchPartitionInterface {
        const newInputs: TransactionCreateInputInterface[] = [];
        const updateParams: ImportedUpdateParamInterface[] = [];
        const resultsOrder: Array<{ kind: 'create' | 'update'; index: number }> = [];

        for (const input of batch) {
            const importedUpdateParam = this.buildImportedUpdateParam(input, existingTransactionIdMap);

            if (isDefined(importedUpdateParam)) {
                resultsOrder.push({ kind: 'update', index: updateParams.length });
                updateParams.push(importedUpdateParam);
            } else {
                resultsOrder.push({ kind: 'create', index: newInputs.length });
                newInputs.push(input);
            }
        }

        return { newInputs, updateParams, resultsOrder };
    }

    private buildImportedUpdateParam(
        input: TransactionCreateInputInterface,
        existingTransactionIdMap: Map<string, number>
    ): ImportedUpdateParamInterface | null {
        const { externalId } = input;

        if (!isDefined(externalId)) {
            return null;
        }

        const transactionId = existingTransactionIdMap.get(externalId);

        if (!isDefined(transactionId)) {
            return null;
        }

        return { transactionId, input };
    }

    private getAccountIdsFromInputs(inputs: readonly TransactionCreateInputInterface[]): number[] {
        return [...new Set(inputs.flatMap(input => input.entries.map(entry => entry.accountId)))];
    }
}

export const transactionImportService = new TransactionImportService();
