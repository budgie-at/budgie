/* eslint-disable no-await-in-loop */
import { BankSyncModeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { extractText } from 'expo-pdf-text-extract';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository } from '../../@generic/drizzle/db/db';
import { transactionService } from '../../transaction/service/transaction.service';
import { BankAccountPreviewInterface } from '../interface/bank-account-preview.interface';
import { getOrCreateBankAccount } from '../util/get-or-create-bank-account.util';
import { mapBankAccountsToPreview } from '../util/map-bank-accounts-to-preview.util';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import type { BankAccountInterface, BankTransactionInterface } from '@budgie/bank-sync';

const PROVIDER = ExternalSourceEnum.ERSTE;

interface ErsteFileClientInterface {
    parse(text: string): void;
    getAccounts(): BankAccountInterface[];
    getTransactions(): BankTransactionInterface[];
}

interface ParsedFileResult {
    readonly client: ErsteFileClientInterface;
    readonly bankAccounts: BankAccountInterface[];
}

class ErsteSyncService {
    async importPreview(filePath: string): Promise<BankAccountPreviewInterface[]> {
        const { bankAccounts } = await this.parseFile(filePath);

        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return mapBankAccountsToPreview(bankAccounts, PROVIDER);
    }

    async quickImport(filePath: string): Promise<void> {
        const { client, bankAccounts } = await this.parseFile(filePath);

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

    /* jscpd:ignore-start */
    async executeImportForSelectedAccounts(filePath: string, selectedAccountIds: string[]): Promise<void> {
        const { client, bankAccounts } = await this.parseFile(filePath);
        const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

        if (!isNotEmptyArray(selectedBankAccounts)) {
            return;
        }

        await this.executeImport(client, selectedBankAccounts);
    }
    /* jscpd:ignore-end */

    /* jscpd:ignore-start */
    private async getEnabledExternalIds(): Promise<Set<string>> {
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(PROVIDER);
        if (!isNotEmptyArray(enabledSyncs)) {
            return new Set();
        }

        const accountIds = enabledSyncs.map(sync => sync.accountId);
        const accounts = await accountRepository.findByIds(accountIds);

        return new Set(accounts.map(account => account.externalId).filter(isDefined));
    }
    /* jscpd:ignore-end */

    private async parseFile(filePath: string): Promise<ParsedFileResult> {
        const text = await extractText(filePath);
        const client = await this.getErsteFileClient();
        client.parse(text);

        return { client, bankAccounts: client.getAccounts() };
    }

    private async getErsteFileClient(): Promise<ErsteFileClientInterface> {
        const module = await import('@budgie/bank-sync');

        return new module.ErsteFileClient();
    }

    /* jscpd:ignore-start */
    private async createBankSyncRecord(accountId: number): Promise<void> {
        const existingSync = await bankSyncRepository.getByAccountId(accountId);
        if (isDefined(existingSync)) {
            return;
        }

        await bankSyncRepository.create({
            token: '',
            accountId,
            provider: PROVIDER,
            enabled: true,
            mode: BankSyncModeEnum.FORWARD
        });
    }
    /* jscpd:ignore-end */

    private async importAccountTransactions(
        client: ErsteFileClientInterface,
        bankAccount: BankAccountInterface,
        existingExternalIds: Set<string>
    ): Promise<void> {
        const account = await getOrCreateBankAccount(bankAccount, PROVIDER);
        await this.createBankSyncRecord(account.id);

        const transactions = client.getTransactions();
        const newTransactions = transactions.filter(transaction => !existingExternalIds.has(transaction.id));

        if (!isNotEmptyArray(newTransactions)) {
            return;
        }

        const transactionInputs = newTransactions.map(transaction =>
            mapBankTransactionToCreateInput(transaction, account.id, null, PROVIDER)
        );

        await transactionService.bulkCreate(transactionInputs);
    }

    private async executeImport(client: ErsteFileClientInterface, bankAccounts: BankAccountInterface[]): Promise<void> {
        const existingExternalIds = await transactionService.findByExternalSource(PROVIDER);

        for (const bankAccount of bankAccounts) {
            await this.importAccountTransactions(client, bankAccount, existingExternalIds);
        }
    }
}

export const ersteSyncService = new ErsteSyncService();
