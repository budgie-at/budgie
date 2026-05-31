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

import { refreshedImportedEntriesService } from './refreshed-imported-entries.service';
import { transactionBatchCreateService } from './transaction-batch-create.service';

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
            `enter externalIds=${inputs.map(input => input.externalId).join(',')} existingKeys=${[...existingTransactionIdMap.keys()].join(',')} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'}`,
        (result, ...[inputs, existingTransactionIdMap, tx, options]) =>
            `done externalIds=${inputs.map(input => input.externalId).join(',')} existingKeys=${[...existingTransactionIdMap.keys()].join(',')} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'} upsertedIds=${result.map(row => row.id).join(',')}`,
        (error, ...[inputs, existingTransactionIdMap, tx, options]) =>
            `throw externalIds=${inputs.map(input => input.externalId).join(',')} existingKeys=${[...existingTransactionIdMap.keys()].join(',')} hasTx=${String(isDefined(tx))} batchSize=${options?.batchSize ?? 'default'} error=${getErrorMessage(error)}`
    )
    async bulkUpsertImported(
        inputs: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>,
        tx?: DB,
        options: TransactionImportOptionsInterface = {}
    ): Promise<TransactionEntityInterface[]> {
        const batchSize = options.batchSize ?? TRANSACTION_BATCH_SIZE;
        const shouldUpdateBalances = options.shouldUpdateBalances ?? true;

        if (!isNotEmptyArray(inputs)) {
            return [];
        }

        if (!isDefined(tx)) {
            return transactionAsync(db, async innerTx => this.bulkUpsertImported(inputs, existingTransactionIdMap, innerTx, options));
        }

        const { stampedInputs } = stampForDeferredEmbedding(inputs, 'import');

        const transactions = await processInputWithBatches(stampedInputs, batchSize, batch =>
            this.processImportedBatchInner(batch, existingTransactionIdMap, tx)
        );

        if (shouldUpdateBalances && isNotEmptyArray(transactions)) {
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        }

        return transactions;
    }

    private async processImportedBatchInner(
        batch: TransactionCreateInputInterface[],
        existingTransactionIdMap: Map<string, number>,
        tx: DB
    ): Promise<TransactionEntityInterface[]> {
        const partition = this.partitionImportedBatch(batch, existingTransactionIdMap);
        const existingTransactionsMap = await this.getExistingTransactionsMap(partition.updateParams, tx);
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
                operatedAt: input.operatedAt
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
}

export const transactionImportService = new TransactionImportService();
