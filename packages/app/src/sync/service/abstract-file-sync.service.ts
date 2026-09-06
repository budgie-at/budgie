/* eslint-disable no-await-in-loop */
import { consolidationScopeService } from '@budgie/consolidation';
import { SyncModeEnum, TransactionCreateInputInterface, TransactionEntityInterface, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, bankIntegrationRepository, db, syncRepository } from '../../@generic/drizzle/db/db';
import { databaseRefreshService } from '../../@generic/service/database-refresh.service';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { transactionImportService } from '../../transaction/service/transaction-import.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { FileBankSyncAccountImportResultInterface } from '../interface/file-bank-sync-account-import-result.interface';
import { FileBankSyncImportResultInterface } from '../interface/file-bank-sync-import-result.interface';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractSyncService } from './abstract-sync.service';
import { syncWorkloadService } from './sync-workload.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { ImportContextInterface } from '../interface/import-context.interface';
import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { AccountEntityInterface, DB, MccCategoryLookupInterface } from '@budgie/contracts';
import type { SyncAccountInterface } from '@budgie/sync';

export abstract class AbstractFileSyncService extends AbstractSyncService {
    override readonly supportsFileImport: boolean = true;

    private importQueue: Promise<unknown> = Promise.resolve();

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

    @Log(
        uri => `enter uri=${uri}`,
        (result, uri) =>
            `done uri=${uri} accountCount=${result.accountCount} parsedTransactionCount=${result.parsedTransactionCount} newTransactionCount=${result.newTransactionCount} existingTransactionCount=${result.existingTransactionCount}`,
        (error, uri) => `throw uri=${uri} error=${getErrorMessage(error)}`
    )
    async quickImport(uri: string): Promise<FileBankSyncImportResultInterface> {
        return this.runQueuedImport(async () => this.quickImportInner(uri));
    }

    @Log(
        (client, bankAccount, context) =>
            `enter accountId=${bankAccount.id} accountIds=${client
                .getAccounts()
                .map(account => account.id)
                .join(',')} existingKeys=${[...context.existingTransactionIdMap.keys()].join(',')}`,
        (result, client, bankAccount, context) =>
            `done accountId=${bankAccount.id} newImportedIds=${result.newTransactions.map(transaction => transaction.id).join(',')} accountIds=${client
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
        client: FileBasedSyncClientInterface,
        bankAccount: SyncAccountInterface,
        context: ImportContextInterface
    ): Promise<FileBankSyncAccountImportResultInterface> {
        const account = await this.prepareImportAccount(bankAccount, context.tx);

        const transactions = client.getTransactions(bankAccount.id);
        if (!isNotEmptyArray(transactions)) {
            return { newTransactions: [], parsedTransactionCount: 0 };
        }
        const transactionInputs = await Promise.all(
            transactions.map(async transaction => {
                const lookup = context.mccCategoryLookupMap.get(transaction.category ?? '') ?? null;

                return mapBankTransactionToCreateInput(transaction, account.id, lookup, this.provider);
            })
        );
        const prepared = transactionImportService.prepareImportedInputs(transactionInputs, context.existingTransactionIdMap);

        const upsertedTransactions = await transactionImportService.bulkUpsertPreparedImported(prepared, context.tx, {
            shouldUpdateBalances: false
        });

        if (isNotEmptyArray(upsertedTransactions)) {
            await accountBalanceIncrementalService.updateBalancesByAccountIds([account.id], context.tx);
        }

        const newTransactions = this.queueRulesForNewlyImportedTransactions(
            prepared.transactionInputs,
            upsertedTransactions,
            prepared.externalIdMap
        );

        return { newTransactions, parsedTransactionCount: transactionInputs.length };
    }

    @Log(
        (_client, bankAccounts) => `enter bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (_result, _client, bankAccounts) => `done bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (error, _client, bankAccounts) =>
            `throw bankAccountIds=${bankAccounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    private async executeImport(
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ): Promise<FileBankSyncImportResultInterface> {
        const importWork = async (): Promise<FileBankSyncImportResultInterface> => {
            const [mccCategoryLookupMap, existingTransactionIdMap] = await Promise.all([
                this.resolveMccCategoryIdMap(client, bankAccounts),
                transactionService.findIdMapByExternalSource(this.provider)
            ]);

            const accountImportResults: FileBankSyncAccountImportResultInterface[] = [];

            await transactionAsync(db, async tx => {
                const context: ImportContextInterface = { mccCategoryLookupMap, existingTransactionIdMap, tx };

                for (const bankAccount of bankAccounts) {
                    accountImportResults.push(await this.importAccountTransactions(client, bankAccount, context));
                    await microPause();
                }
            });

            const newlyImportedTransactions = accountImportResults.flatMap(result => result.newTransactions);
            const scope = consolidationScopeService.buildFromTransactions(newlyImportedTransactions);
            if (isDefined(scope)) {
                transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.FILE_IMPORT, scope);
            }

            return this.buildImportResult(bankAccounts.length, accountImportResults);
        };

        const result = await syncWorkloadService.runUser(`${this.provider}-file-import`, importWork);
        databaseRefreshService.notifyChanged();

        return result;
    }

    @Log(
        (bankAccount, tx) => `enter externalId=${bankAccount.id} hasTx=${String(isDefined(tx))}`,
        (result, bankAccount, tx) => `done externalId=${bankAccount.id} hasTx=${String(isDefined(tx))} accountId=${result.id}`,
        (error, bankAccount, tx) => `throw externalId=${bankAccount.id} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    private async prepareImportAccount(bankAccount: SyncAccountInterface, tx: DB): Promise<AccountEntityInterface> {
        const account = await this.getOrCreateSyncAccount(bankAccount, tx);
        await this.createBankSyncRecord(account.id, tx);
        await this.linkFileImportIntegration(account, tx);

        return account;
    }

    @Log(
        (account, tx) => `enter accountId=${account.id} integrationId=${account.integrationId} hasTx=${String(isDefined(tx))}`,
        (_result, account, tx) => `done accountId=${account.id} integrationId=${account.integrationId} hasTx=${String(isDefined(tx))}`,
        (error, account, tx) =>
            `throw accountId=${account.id} integrationId=${account.integrationId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    private async linkFileImportIntegration(account: AccountEntityInterface, tx: DB): Promise<void> {
        if (isDefined(account.integrationId)) {
            return;
        }

        const existingIntegration = await bankIntegrationRepository.findFileImportIntegration(this.provider, tx);
        const integration = existingIntegration ?? (await bankIntegrationRepository.create({ provider: this.provider, token: '' }, tx));

        await accountRepository.updateById(account.id, { integrationId: integration.id }, tx);
    }

    private async executeImportForSelectedAccountsInner(uri: string, selectedAccountIds: string[]): Promise<void> {
        const { client, bankAccounts } = await this.parseFile(uri);
        const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

        if (!isNotEmptyArray(selectedBankAccounts)) {
            return;
        }

        await this.executeImport(client, selectedBankAccounts);
    }

    private async quickImportInner(uri: string): Promise<FileBankSyncImportResultInterface> {
        const { client, bankAccounts } = await this.parseFile(uri);

        if (!isNotEmptyArray(bankAccounts)) {
            return this.buildEmptyImportResult(0);
        }

        const enabledExternalIds = await this.getEnabledExternalIds();
        if (enabledExternalIds.size === 0) {
            return this.buildEmptyImportResult(0);
        }

        const enabledBankAccounts = this.getEnabledBankAccounts(bankAccounts, enabledExternalIds);
        if (!isNotEmptyArray(enabledBankAccounts)) {
            return this.buildEmptyImportResult(0);
        }

        return this.executeImport(client, enabledBankAccounts);
    }

    private async runQueuedImport<T>(handler: () => Promise<T>): Promise<T> {
        const queuedImport = this.importQueue.then(handler, handler);
        this.importQueue = queuedImport.catch(emptyFn);

        return queuedImport;
    }

    private getEnabledBankAccounts(bankAccounts: SyncAccountInterface[], enabledExternalIds: Set<string>): SyncAccountInterface[] {
        return bankAccounts.filter(account => enabledExternalIds.has(account.id));
    }

    private buildEmptyImportResult(accountCount: number): FileBankSyncImportResultInterface {
        return {
            accountCount,
            existingTransactionCount: 0,
            newTransactionCount: 0,
            parsedTransactionCount: 0
        };
    }

    private buildImportResult(
        accountCount: number,
        accountImportResults: FileBankSyncAccountImportResultInterface[]
    ): FileBankSyncImportResultInterface {
        const parsedTransactionCount = accountImportResults.reduce((total, result) => total + result.parsedTransactionCount, 0);
        const newTransactionCount = accountImportResults.reduce((total, result) => total + result.newTransactions.length, 0);

        return {
            accountCount,
            existingTransactionCount: parsedTransactionCount - newTransactionCount,
            newTransactionCount,
            parsedTransactionCount
        };
    }

    private async getEnabledExternalIds(): Promise<Set<string>> {
        const enabledSyncs = await syncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return new Set();
        }

        const accountIds = enabledSyncs.map(sync => sync.accountId);
        const accounts = await accountRepository.findByIds(accountIds);

        return new Set(accounts.map(account => account.externalId).filter(isDefined));
    }

    private async createBankSyncRecord(accountId: number, tx: DB): Promise<void> {
        const existingSync = await syncRepository.getByAccountId(accountId, tx);
        if (isDefined(existingSync)) {
            return;
        }

        await syncRepository.create(
            {
                accountId,
                provider: this.provider,
                enabled: true,
                mode: SyncModeEnum.FORWARD
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
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ): Promise<Map<string, MccCategoryLookupInterface | null>>;
}
