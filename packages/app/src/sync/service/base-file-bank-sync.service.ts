/* eslint-disable no-await-in-loop */
import { BankSyncModeEnum, ExternalSourceEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository, db } from '../../@generic/drizzle/db/db';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { transactionImportService } from '../../transaction/service/transaction-import.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import type { FileBasedBankSyncClientInterface } from '../interface/file-based-bank-sync-client.interface';
import type { ImportContextInterface } from '../interface/import-context.interface';
import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { BankAccountInterface } from '@budgie/bank-sync';
import type { DB, MccCategoryLookupInterface } from '@budgie/contracts';

export abstract class BaseFileBankSyncService {
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
        (_result, uri, selectedAccountIds) => `done uri=${uri} selectedAccountIds=${selectedAccountIds.join(',')}`,
        (error, uri, selectedAccountIds) =>
            `throw uri=${uri} selectedAccountIds=${selectedAccountIds.join(',')} error=${getErrorMessage(error)}`
    )
    async executeImportForSelectedAccounts(uri: string, selectedAccountIds: string[]): Promise<void> {
        const { client, bankAccounts } = await this.parseFile(uri);
        const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

        if (!isNotEmptyArray(selectedBankAccounts)) {
            return;
        }

        await this.executeImport(client, selectedBankAccounts);
    }

    @Log(uri => `enter uri=${uri}`, (_result, uri) => `done uri=${uri}`, (error, uri) => `throw uri=${uri} error=${getErrorMessage(error)}`)
    async quickImport(uri: string): Promise<void> {
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

    @Log(
        (client, bankAccount, context) =>
            `enter accountId=${bankAccount.id} accountIds=${client
                .getAccounts()
                .map(account => account.id)
                .join(',')} existingKeys=${[...context.existingTransactionIdMap.keys()].join(',')}`,
        'done',
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
    ): Promise<void> {
        const account = await getOrCreateBankAccount(bankAccount, this.provider, context.tx);
        await this.createBankSyncRecord(account.id, context.tx);

        const transactions = client.getTransactions(bankAccount.id);
        if (!isNotEmptyArray(transactions)) {
            return;
        }

        const transactionInputs = transactions.map(transaction => {
            const mccCategoryLookup = isNotEmptyString(transaction.category)
                ? (context.mccCategoryLookupMap.get(transaction.category) ?? null)
                : null;

            return mapBankTransactionToCreateInput(transaction, account.id, mccCategoryLookup, this.provider);
        });

        const upsertedTransactions = await transactionImportService.bulkUpsertImported(
            transactionInputs,
            context.existingTransactionIdMap,
            context.tx,
            {
                shouldUpdateBalances: false
            }
        );

        const newInputs = transactionInputs.filter(
            input => !isDefined(input.externalId) || !context.existingTransactionIdMap.has(input.externalId)
        );
        const newTransactionIds = upsertedTransactions
            .filter(transaction => !isDefined(transaction.externalId) || !context.existingTransactionIdMap.has(transaction.externalId))
            .map(transaction => transaction.id);

        ruleApplicationDrainerService.enqueueTransactions(newTransactionIds, newInputs);
    }

    @Log(
        (_client, bankAccounts) => `enter bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (_result, _client, bankAccounts) => `done bankAccountIds=${bankAccounts.map(account => account.id).join(',')}`,
        (error, _client, bankAccounts) =>
            `throw bankAccountIds=${bankAccounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    private async executeImport(client: FileBasedBankSyncClientInterface, bankAccounts: BankAccountInterface[]): Promise<void> {
        const [mccCategoryLookupMap, existingTransactionIdMap] = await Promise.all([
            this.resolveMccCategoryIdMap(client, bankAccounts),
            transactionService.findIdMapByExternalSource(this.provider)
        ]);

        await transactionAsync(db, async tx => {
            const context: ImportContextInterface = { mccCategoryLookupMap, existingTransactionIdMap, tx };

            for (const bankAccount of bankAccounts) {
                await this.importAccountTransactions(client, bankAccount, context);
            }

            await transactionService.updateAllBalances(tx);
        });
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

    protected abstract parseFile(uri: string): Promise<ParsedFileResultInterface>;

    protected abstract resolveMccCategoryIdMap(
        client: FileBasedBankSyncClientInterface,
        bankAccounts: BankAccountInterface[]
    ): Promise<Map<string, MccCategoryLookupInterface | null>>;
}
