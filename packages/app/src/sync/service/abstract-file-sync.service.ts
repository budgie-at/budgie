/* eslint-disable no-await-in-loop */
import { consolidationScopeService } from '@budgie/consolidation';
import {
    BankSyncModeEnum,
    ExternalSourceEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    transactionAsync
} from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository, db } from '../../@generic/drizzle/db/db';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { transactionImportService } from '../../transaction/service/transaction-import.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractSyncService } from './abstract-sync.service';
import { syncWorkloadService } from './sync-workload.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type { FileBasedBankSyncClientInterface } from '../interface/file-based-bank-sync-client.interface';
import type { ImportContextInterface } from '../interface/import-context.interface';
import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { BankAccountInterface } from '@budgie/bank-sync';
import type { DB, MccCategoryLookupInterface } from '@budgie/contracts';

export abstract class AbstractFileSyncService extends AbstractSyncService {
    protected readonly provider: ExternalSourceEnum;

    private importQueue: Promise<void> = Promise.resolve();

    constructor(provider: ExternalSourceEnum) {
        super();
        this.provider = provider;
    }

    @Log(
        uri => `enter uri=${uri}`,
        (result, uri) => `done uri=${uri} previewCount=${result.length}`,
        (error, uri) => `throw uri=${uri} error=${getErrorMessage(error)}`
    )
    async importPreview(uri: string): Promise<SyncAccountPreviewInterface[]> {
        const { bankAccounts } = await this.parseFile(uri);

        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return this.mapAccountsToPreview(bankAccounts);
    }

    @Log(
        (uri, selectedAccountIds) => `enter uri=${uri} selectedAccountIds=${selectedAccountIds.join(',')}`,
        (_result, uri, selectedAccountIds) => `done uri=${uri} selectedAccountIds=${selectedAccountIds.join(',')}`,
        (error, uri, selectedAccountIds) =>
            `throw uri=${uri} selectedAccountIds=${selectedAccountIds.join(',')} error=${getErrorMessage(error)}`
    )
    async executeImportForSelectedAccounts(uri: string, selectedAccountIds: string[]): Promise<void> {
        return this.runQueuedImport(async () => {
            await this.executeImportForSelectedAccountsInner(uri, selectedAccountIds);
        });
    }

    @Log(uri => `enter uri=${uri}`, (_result, uri) => `done uri=${uri}`, (error, uri) => `throw uri=${uri} error=${getErrorMessage(error)}`)
    async quickImport(uri: string): Promise<void> {
        return this.runQueuedImport(async () => {
            await this.quickImportInner(uri);
        });
    }

    @Log(
        (client, bankAccount, context) =>
            `enter accountId=${bankAccount.id} accountIds=${client
                .getAccounts()
                .map(account => account.id)
                .join(',')} existingKeys=${[...context.existingTransactionIdMap.keys()].join(',')}`,
        (result, client, bankAccount, context) =>
            `done accountId=${bankAccount.id} newImportedIds=${result.map(transaction => transaction.id).join(',')} accountIds=${client
                .getAccounts()
                .map(account => account.id)
                .join(',')} existingKeys=${[...context.existingTransactionIdMap.keys()].join(',')}`,
        (error, client, bankAccount, context) =>
            `throw accountId=${bankAccount.id} accountIds=${client
                .getAccounts()
                .map(account => account.id)
                .join(',')} existingKeys=${[...context.existingTransactionIdMap.keys()].join(',')} error=${getErrorMessage(error)}`
    )
    private async importAccountTransactions(
        client: FileBasedBankSyncClientInterface,
        bankAccount: BankAccountInterface,
        context: ImportContextInterface
    ): Promise<TransactionEntityInterface[]> {
        const account = await getOrCreateBankAccount(bankAccount, this.provider, context.tx);
        await this.createBankSyncRecord(account.id, context.tx);

        const transactions = client.getTransactions(bankAccount.id);
        if (!isNotEmptyArray(transactions)) {
            return [];
        }
        const transactionInputs = transactions.map(transaction => {
            const lookup = context.mccCategoryLookupMap.get(transaction.category ?? '') ?? null;

            return mapBankTransactionToCreateInput(transaction, account.id, lookup, this.provider);
        });
        const prepared = transactionImportService.prepareImportedInputs(transactionInputs, context.existingTransactionIdMap);

        const upsertedTransactions = await transactionImportService.bulkUpsertPreparedImported(prepared, context.tx, {
            shouldUpdateBalances: false
        });

        if (isNotEmptyArray(upsertedTransactions)) {
            await accountBalanceIncrementalService.updateBalancesByAccountIds([account.id], context.tx);
        }

        return this.queueRulesForNewlyImportedTransactions(prepared.transactionInputs, upsertedTransactions, prepared.externalIdMap);
    }

    @Log(
        (_client, bankAccounts) => `enter bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (_result, _client, bankAccounts) => `done bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (error, _client, bankAccounts) =>
            `throw bankAccountIds=${bankAccounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    private async executeImport(client: FileBasedBankSyncClientInterface, bankAccounts: BankAccountInterface[]): Promise<void> {
        const importWork = async (): Promise<void> => {
            const [mccCategoryLookupMap, existingTransactionIdMap] = await Promise.all([
                this.resolveMccCategoryIdMap(client, bankAccounts),
                transactionService.findIdMapByExternalSource(this.provider)
            ]);

            const newlyImportedTransactions: TransactionEntityInterface[] = [];

            await transactionAsync(db, async tx => {
                const context: ImportContextInterface = { mccCategoryLookupMap, existingTransactionIdMap, tx };

                for (const bankAccount of bankAccounts) {
                    newlyImportedTransactions.push(...(await this.importAccountTransactions(client, bankAccount, context)));
                    await microPause();
                }
            });

            const scope = consolidationScopeService.buildFromTransactions(newlyImportedTransactions);
            if (isDefined(scope)) {
                transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.FILE_IMPORT, scope);
            }
        };

        await syncWorkloadService.run(`${this.provider}-file-import`, importWork);
    }

    private async executeImportForSelectedAccountsInner(uri: string, selectedAccountIds: string[]): Promise<void> {
        const { client, bankAccounts } = await this.parseFile(uri);
        const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

        if (!isNotEmptyArray(selectedBankAccounts)) {
            return;
        }

        await this.executeImport(client, selectedBankAccounts);
    }

    private async quickImportInner(uri: string): Promise<void> {
        const { client, bankAccounts } = await this.parseFile(uri);

        if (!isNotEmptyArray(bankAccounts)) {
            return;
        }

        const enabledExternalIds = await this.getEnabledExternalIds();
        if (enabledExternalIds.size === 0) {
            return;
        }

        const enabledBankAccounts = bankAccounts.filter(account => enabledExternalIds.has(account.id));
        if (!isNotEmptyArray(enabledBankAccounts)) {
            return;
        }

        await this.executeImport(client, enabledBankAccounts);
    }

    private async runQueuedImport(handler: () => Promise<void>): Promise<void> {
        const queuedImport = this.importQueue.then(handler, handler);
        this.importQueue = queuedImport.catch(emptyFn);

        return queuedImport;
    }

    private async getEnabledExternalIds(): Promise<Set<string>> {
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return new Set();
        }

        const accountIds = enabledSyncs.map(sync => sync.accountId);
        const accounts = await accountRepository.findByIds(accountIds);

        return new Set(accounts.map(account => account.externalId).filter(isDefined));
    }

    private async createBankSyncRecord(accountId: number, tx: DB): Promise<void> {
        const existingSync = await bankSyncRepository.getByAccountId(accountId, tx);
        if (isDefined(existingSync)) {
            return;
        }

        await bankSyncRepository.create(
            {
                token: '',
                accountId,
                provider: this.provider,
                enabled: true,
                mode: BankSyncModeEnum.FORWARD
            },
            tx
        );
    }

    private queueRulesForNewlyImportedTransactions(
        transactionInputs: TransactionCreateInputInterface[],
        upsertedTransactions: TransactionEntityInterface[],
        existingTransactionIdMap: Map<string, number>
    ): TransactionEntityInterface[] {
        const wasNotPreviouslyImported = ({ externalId }: { externalId: string | null }) =>
            !isDefined(externalId) || !existingTransactionIdMap.has(externalId);

        const newInputs = transactionInputs.filter(wasNotPreviouslyImported);
        const newTransactions = upsertedTransactions.filter(wasNotPreviouslyImported);
        const newTransactionIds = newTransactions.map(transaction => transaction.id);

        if (isNotEmptyArray(newTransactionIds)) {
            ruleApplicationDrainerService.enqueueTransactions(newTransactionIds, newInputs);
        }

        return newTransactions;
    }

    protected abstract parseFile(uri: string): Promise<ParsedFileResultInterface>;

    protected abstract resolveMccCategoryIdMap(
        client: FileBasedBankSyncClientInterface,
        bankAccounts: BankAccountInterface[]
    ): Promise<Map<string, MccCategoryLookupInterface | null>>;
}
