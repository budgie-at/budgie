import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
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
import type {
    DB,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

class TransactionImportService {
    @Log(
        (inputs, existingTransactionIdMap, tx, options) =>
            `enter inputCount=${inputs.length} existingKeyCount=${existingTransactionIdMap.size} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'}`,
        (result, ...[inputs, existingTransactionIdMap, tx, options]) =>
            `done inputCount=${inputs.length} existingKeyCount=${existingTransactionIdMap.size} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'} upsertedCount=${result.length} upsertedIds=${result.map(row => row.id).join(',')}`,
        (error, ...[inputs, existingTransactionIdMap, tx, options]) =>
            `throw inputCount=${inputs.length} existingKeyCount=${existingTransactionIdMap.size} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'} error=${getErrorMessage(error)}`
    )
    async bulkUpsertImported(
        inputs: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>,
        tx?: DB,
        options: TransactionImportOptionsInterface = {}
    ): Promise<TransactionEntityInterface[]> {
        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        if (!isDefined(tx)) {
            return transactionAsync(db, async innerTx => this.bulkUpsertImported(inputs, existingTransactionIdMap, innerTx, options));
        }

        const prepared = this.prepareImportedInputs(inputs, existingTransactionIdMap);

        return this.bulkUpsertPreparedImported(prepared, tx, options);
    }

    @Log(
        (prepared, tx, options) =>
            `enter inputCount=${prepared.transactionInputs.length} existingKeyCount=${prepared.externalIdMap.size} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'}`,
        (result, ...[prepared, tx, options]) =>
            `done inputCount=${prepared.transactionInputs.length} existingKeyCount=${prepared.externalIdMap.size} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'} upsertedCount=${result.length} upsertedIds=${result.map(row => row.id).join(',')}`,
        (error, ...[prepared, tx, options]) =>
            `throw inputCount=${prepared.transactionInputs.length} existingKeyCount=${prepared.externalIdMap.size} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'} error=${getErrorMessage(error)}`
    )
    async bulkUpsertPreparedImported(
        prepared: ImportedBatchPreparationInterface,
        tx?: DB,
        options: TransactionImportOptionsInterface = {}
    ): Promise<TransactionEntityInterface[]> {
        const batchSize = options.batchSize ?? TRANSACTION_BATCH_SIZE;
        const shouldUpdateBalances = options.shouldUpdateBalances ?? true;

        if (!isNotEmptyArray(prepared.transactionInputs)) {
            return [];
        }

        if (!isDefined(tx)) {
            return transactionAsync(db, async innerTx => this.bulkUpsertPreparedImported(prepared, innerTx, options));
        }

        const { stampedInputs } = stampForDeferredEmbedding(prepared.transactionInputs, 'import');

        const transactions = await processInputWithBatches(stampedInputs, batchSize, batch =>
            this.processImportedBatchInner(batch, prepared.externalIdMap, tx)
        );

        if (shouldUpdateBalances && isNotEmptyArray(transactions)) {
            await accountBalanceIncrementalService.updateBalancesByAccountIds(this.getAccountIdsFromInputs(stampedInputs), tx);
        }

        return transactions;
    }

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

    private async processImportedBatchInner(
        batch: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>,
        tx: DB
    ): Promise<TransactionEntityInterface[]> {
        const partition = this.partitionImportedBatch(batch, existingTransactionIdMap);
        const existingTransactionsMap = await this.getExistingTransactionsMap(partition.updateParams, tx);

        await transactionDepositSafetyService.assertNoDepositExpenseInputs(partition.newInputs, tx);
        await transactionDepositSafetyService.assertNoDepositExpenseTransactions([...existingTransactionsMap.values()], tx);

        const createdTransactions = await transactionBatchCreateService.create(partition.newInputs, tx);
        const updatedTransactions = await Promise.all(
            partition.updateParams.map(params =>
                this.updateImportedTransaction(
                    params.transactionId,
                    params.input,
                    existingTransactionsMap.get(params.transactionId) ?? null,
                    tx
                )
            )
        );

        return partition.resultsOrder.map(result =>
            result.kind === 'create' ? createdTransactions[result.index] : updatedTransactions[result.index]
        );
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

    private async updateImportedTransaction(
        transactionId: number,
        input: TransactionCreateInputInterface,
        existingTransaction: TransactionWithEntriesEntityInterface | null,
        tx: DB
    ): Promise<TransactionEntityInterface> {
        const comment =
            isDefined(existingTransaction) && isNotEmptyString(existingTransaction.comment) ? existingTransaction.comment : input.comment;
        const updated = await transactionRepository.updateById(
            transactionId,
            {
                title: input.title,
                comment,
                operatedAt: input.operatedAt,
                externalId: input.externalId,
                externalSource: input.externalSource
            },
            tx
        );

        await this.refreshImportedTransactionEntries(transactionId, input, existingTransaction, tx);

        return updated;
    }

    private async refreshImportedTransactionEntries(
        transactionId: number,
        input: TransactionCreateInputInterface,
        existingTransaction: TransactionWithEntriesEntityInterface | null,
        tx: DB
    ): Promise<void> {
        if (!isDefined(existingTransaction)) {
            return;
        }

        const refreshedEntriesResult = await refreshedImportedEntriesService.build(
            {
                existingEntries: existingTransaction.entries,
                inputEntries: input.entries,
                transactionId,
                input
            },
            tx
        );

        if (refreshedEntriesResult.status !== RefreshedImportedEntriesStatusEnum.REFRESHED || !isDefined(refreshedEntriesResult.entries)) {
            return;
        }

        await transactionEntryRepository.deleteByTransactionId(transactionId, tx);
        await transactionEntryRepository.bulkCreate([...refreshedEntriesResult.entries], tx);
    }

    private async getExistingTransactionsMap(
        updateParams: readonly ImportedUpdateParamInterface[],
        tx: DB
    ): Promise<Map<number, TransactionWithEntriesEntityInterface>> {
        const transactionIds = updateParams.map(({ transactionId }) => transactionId);
        const existingTransactions = await transactionRepository.findByIds(transactionIds, tx);

        return new Map(
            existingTransactions.map((transaction): [number, TransactionWithEntriesEntityInterface] => [transaction.id, transaction])
        );
    }

    private getAccountIdsFromInputs(inputs: readonly TransactionCreateInputInterface[]): number[] {
        return [...new Set(inputs.flatMap(input => input.entries.map(entry => entry.accountId)))];
    }
}

export const transactionImportService = new TransactionImportService();
