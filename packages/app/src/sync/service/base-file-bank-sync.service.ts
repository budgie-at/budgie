/* eslint-disable no-await-in-loop */
import { consolidationScopeService } from '@budgie/consolidation';
import { BankSyncModeEnum, ExternalSourceEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository, db } from '../../@generic/drizzle/db/db';
import { databaseRefreshService } from '../../@generic/service/database-refresh.service';
import { microPause } from '../../@generic/utils/micro-pause.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { transactionImportService } from '../../transaction/service/transaction-import.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { FileBankSyncAccountImportResultInterface } from '../interface/file-bank-sync-account-import-result.interface';
import { FileBankSyncImportResultInterface } from '../interface/file-bank-sync-import-result.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { syncWorkloadService } from './sync-workload.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type { FileBasedBankSyncClientInterface } from '../interface/file-based-bank-sync-client.interface';
import type { ImportContextInterface } from '../interface/import-context.interface';
import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { BankAccountInterface } from '@budgie/bank-sync';
import type { DB, MccCategoryLookupInterface, TransactionCreateInputInterface, TransactionEntityInterface } from '@budgie/contracts';

export abstract class BaseFileBankSyncService {
    private importQueue: Promise<unknown> = Promise.resolve();

    constructor(protected readonly provider: ExternalSourceEnum) {}

    @Log(
        uri => `enter uri=${uri}`,
        (result, uri) => `done uri=${uri} previewCount=${result.length}`,
        (error, uri) => `throw uri=${uri} error=${getErrorMessage(error)}`
    )
    async importPreview(uri: string): Promise<BankAccountPreviewInterface[]> {
        const { bankAccounts } = await this.parseFile(uri);

        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return mapBankAccountsToPreview(bankAccounts, this.provider);
    }

    @Log(
        (uri, selectedAccountIds) => `enter uri=${uri} selectedAccountIds=${selectedAccountIds.join(',')}`,
        (result, uri, selectedAccountIds) =>
            `done uri=${uri} selectedAccountIds=${selectedAccountIds.join(',')} accountCount=${result.accountCount} parsedTransactionCount=${result.parsedTransactionCount} newTransactionCount=${result.newTransactionCount} existingTransactionCount=${result.existingTransactionCount}`,
        (error, uri, selectedAccountIds) =>
            `throw uri=${uri} selectedAccountIds=${selectedAccountIds.join(',')} error=${getErrorMessage(error)}`
    )
    async executeImportForSelectedAccounts(uri: string, selectedAccountIds: string[]): Promise<FileBankSyncImportResultInterface> {
        return this.runQueuedImport(() => this.executeImportForSelectedAccountsInner(uri, selectedAccountIds));
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

    @Log('enter', result => `done count=${result.size} ids=${[...result].join(',')}`, error => `throw error=${getErrorMessage(error)}`)
    private async getEnabledExternalIds(): Promise<Set<string>> {
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return new Set();
        }

        const accountIds = enabledSyncs.map(sync => sync.accountId);
        const accounts = await accountRepository.findByIds(accountIds);

        return new Set(accounts.map(account => account.externalId).filter(isDefined));
    }

    @Log(
        (bankAccounts, enabledExternalIds) =>
            `enter bankAccountIds=${bankAccounts.map(account => account.id).join(',')} enabledExternalIds=${[...enabledExternalIds].join(',')}`,
        (result, bankAccounts, enabledExternalIds) =>
            `done bankAccountIds=${bankAccounts.map(account => account.id).join(',')} enabledExternalIds=${[...enabledExternalIds].join(
                ','
            )} enabledBankAccountIds=${result.map(account => account.id).join(',')}`,
        (error, bankAccounts, enabledExternalIds) =>
            `throw bankAccountIds=${bankAccounts.map(account => account.id).join(',')} enabledExternalIds=${[...enabledExternalIds].join(
                ','
            )} error=${getErrorMessage(error)}`
    )
    private getEnabledBankAccounts(bankAccounts: BankAccountInterface[], enabledExternalIds: Set<string>): BankAccountInterface[] {
        return bankAccounts.filter(account => enabledExternalIds.has(account.id));
    }

    @Log(
        (client, bankAccount, context) =>
            `enter client="${client.constructor.name}" accountId=${bankAccount.id} existingKeyCount=${context.existingTransactionIdMap.size} mccCategoryCount=${context.mccCategoryLookupMap.size}`,
        (result, client, bankAccount, context) =>
            `done client="${client.constructor.name}" accountId=${bankAccount.id} parsedTransactionCount=${result.parsedTransactionCount} newTransactionCount=${result.newTransactions.length} newTransactionIds=${result.newTransactions.map(transaction => transaction.id).join(',')} existingKeyCount=${context.existingTransactionIdMap.size} mccCategoryCount=${context.mccCategoryLookupMap.size}`,
        (error, client, bankAccount, context) =>
            `throw client="${client.constructor.name}" accountId=${bankAccount.id} existingKeyCount=${context.existingTransactionIdMap.size} mccCategoryCount=${context.mccCategoryLookupMap.size} error=${getErrorMessage(error)}`
    )
    private async importAccountTransactions(
        client: FileBasedBankSyncClientInterface,
        bankAccount: BankAccountInterface,
        context: ImportContextInterface
    ): Promise<FileBankSyncAccountImportResultInterface> {
        const account = await getOrCreateBankAccount(bankAccount, this.provider, context.tx);
        await this.createBankSyncRecord(account.id, context.tx);

        const transactions = client.getTransactions(bankAccount.id);
        if (!isNotEmptyArray(transactions)) {
            return { newTransactions: [], parsedTransactionCount: 0 };
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

        const newTransactions = this.queueRulesForNewlyImportedTransactions(
            prepared.transactionInputs,
            upsertedTransactions,
            prepared.externalIdMap
        );

        return { newTransactions, parsedTransactionCount: transactionInputs.length };
    }

    @Log(
        (client, bankAccounts) =>
            `enter client="${client.constructor.name}" bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (result, client, bankAccounts) =>
            `done accountCount=${result.accountCount} parsedTransactionCount=${result.parsedTransactionCount} newTransactionCount=${result.newTransactionCount} existingTransactionCount=${result.existingTransactionCount} client="${client.constructor.name}" bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (error, client, bankAccounts) =>
            `throw client="${client.constructor.name}" bankAccountIds=${bankAccounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    private async executeImport(
        client: FileBasedBankSyncClientInterface,
        bankAccounts: BankAccountInterface[]
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

    private async executeImportForSelectedAccountsInner(
        uri: string,
        selectedAccountIds: string[]
    ): Promise<FileBankSyncImportResultInterface> {
        const { client, bankAccounts } = await this.parseFile(uri);
        const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

        if (!isNotEmptyArray(selectedBankAccounts)) {
            return this.buildEmptyImportResult(0);
        }

        return this.executeImport(client, selectedBankAccounts);
    }

    private async runQueuedImport<T>(handler: () => Promise<T>): Promise<T> {
        const queuedImport = this.importQueue.then(handler, handler);
        this.importQueue = queuedImport.catch(emptyFn);

        return queuedImport;
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
