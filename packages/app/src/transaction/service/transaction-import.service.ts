import {
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface,
    transactionAsync
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionEntryRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSACTION_BATCH_SIZE } from '../constant/transaction-batch-size.constant';
import { ImportedBatchPartitionInterface } from '../interface/imported-batch-partition.interface';
import { ImportedEntryMatchInterface } from '../interface/imported-entry-match.interface';
import { ImportedUpdateParamInterface } from '../interface/imported-update-param.interface';
import { RefreshedImportedEntriesResultInterface } from '../interface/refreshed-imported-entries-result.interface';
import { TransactionImportOptionsInterface } from '../interface/transaction-import-options.interface';
import { RefreshedImportedEntriesStatusEnum } from '../type/refreshed-imported-entries-status.enum';

import { transactionBatchCreateService } from './transaction-batch-create.service';

import type { DB } from '@budgie/contracts';

class TransactionImportService {
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

        const transactions = await processInputWithBatches(inputs, batchSize, batch =>
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
        const updated = await transactionRepository.updateById(
            transactionId,
            {
                title: input.title,
                comment: input.comment,
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

        const refreshedEntriesResult = this.buildRefreshedImportedEntries(existingTransaction.entries, input.entries, transactionId);

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

    private buildRefreshedImportedEntries(
        existingEntries: TransactionEntryEntityInterface[],
        inputEntries: TransactionEntryCreateInputInterface[],
        transactionId: number
    ): RefreshedImportedEntriesResultInterface {
        if (existingEntries.length !== inputEntries.length) {
            return { status: RefreshedImportedEntriesStatusEnum.LENGTH_MISMATCH, entries: null };
        }

        const remainingInputEntries = [...inputEntries];
        const refreshedEntries: TransactionEntryCreateEntityInterface[] = [];

        for (const existingEntry of existingEntries) {
            const importedEntryMatch = this.findImportedEntryMatch(existingEntry, remainingInputEntries);

            if (!isDefined(importedEntryMatch.matchingInputIndex)) {
                return { status: importedEntryMatch.status, entries: null };
            }

            const [matchingInput] = remainingInputEntries.splice(importedEntryMatch.matchingInputIndex, 1);
            refreshedEntries.push(this.buildRefreshedImportedEntry(existingEntry, matchingInput, transactionId));
        }

        return { status: RefreshedImportedEntriesStatusEnum.REFRESHED, entries: refreshedEntries };
    }

    private buildRefreshedImportedEntry(
        existingEntry: TransactionEntryEntityInterface,
        matchingInput: TransactionEntryCreateInputInterface,
        transactionId: number
    ): TransactionEntryCreateEntityInterface {
        return {
            transactionId,
            accountId: existingEntry.accountId,
            categoryId: existingEntry.categoryId,
            mccCategoryId: existingEntry.mccCategoryId,
            type: existingEntry.type,
            amount: existingEntry.amount,
            externalId: matchingInput.externalId ?? existingEntry.externalId,
            exchangeRate: matchingInput.exchangeRate ?? existingEntry.exchangeRate,
            toIban: matchingInput.toIban ?? existingEntry.toIban
        };
    }

    private findImportedEntryMatch(
        existingEntry: TransactionEntryEntityInterface,
        inputEntries: TransactionEntryCreateInputInterface[]
    ): ImportedEntryMatchInterface {
        const externalIdMatchIndex = this.findExternalIdMatchIndex(existingEntry, inputEntries);

        if (isDefined(externalIdMatchIndex)) {
            return {
                status: RefreshedImportedEntriesStatusEnum.REFRESHED,
                matchingInputIndex: externalIdMatchIndex
            };
        }

        const fallbackMatchIndexes = this.findFallbackMatchIndexes(existingEntry, inputEntries);

        if (!isNotEmptyArray(fallbackMatchIndexes)) {
            return {
                status: RefreshedImportedEntriesStatusEnum.NO_MATCH,
                matchingInputIndex: null
            };
        }

        if (fallbackMatchIndexes.length > 1) {
            return {
                status: RefreshedImportedEntriesStatusEnum.AMBIGUOUS_MATCH,
                matchingInputIndex: null
            };
        }

        return {
            status: RefreshedImportedEntriesStatusEnum.REFRESHED,
            matchingInputIndex: fallbackMatchIndexes[0]
        };
    }

    private findExternalIdMatchIndex(
        existingEntry: TransactionEntryEntityInterface,
        inputEntries: TransactionEntryCreateInputInterface[]
    ): number | null {
        if (!isDefined(existingEntry.externalId)) {
            return null;
        }

        const externalIdMatchIndex = inputEntries.findIndex(inputEntry => inputEntry.externalId === existingEntry.externalId);

        return externalIdMatchIndex >= 0 ? externalIdMatchIndex : null;
    }

    private findFallbackMatchIndexes(
        existingEntry: TransactionEntryEntityInterface,
        inputEntries: TransactionEntryCreateInputInterface[]
    ): number[] {
        return inputEntries.flatMap((inputEntry, index) =>
            inputEntry.accountId === existingEntry.accountId && inputEntry.type === existingEntry.type ? [index] : []
        );
    }
}

export const transactionImportService = new TransactionImportService();
