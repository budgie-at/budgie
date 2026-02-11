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

class ErsteSyncService {
    async importPreview(filePath: string): Promise<BankAccountPreviewInterface[]> {
        const text = await extractText(filePath);
        const client = await this.getErsteFileClient();
        client.parse(text);
        const bankAccounts = client.getAccounts();

        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return mapBankAccountsToPreview(bankAccounts, PROVIDER);
    }

    /* jscpd:ignore-start */
    async executeImportForSelectedAccounts(filePath: string, selectedAccountIds: string[]): Promise<void> {
        const text = await extractText(filePath);
        const client = await this.getErsteFileClient();
        client.parse(text);
        const bankAccounts = client.getAccounts();
        const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

        if (!isNotEmptyArray(selectedBankAccounts)) {
            return;
        }

        await this.executeImport(client, selectedBankAccounts);
    }
    /* jscpd:ignore-end */

    async quickImport(filePath: string): Promise<void> {
        const text = await extractText(filePath);
        const client = await this.getErsteFileClient();
        client.parse(text);
        const bankAccounts = client.getAccounts();

        if (!isNotEmptyArray(bankAccounts)) {
            return;
        }

        const enabledExternalIds = await this.getEnabledExternalIds();
        const enabledBankAccounts = bankAccounts.filter(account => enabledExternalIds.has(account.id));
        if (!isNotEmptyArray(enabledBankAccounts)) {
            return;
        }

        await this.executeImport(client, enabledBankAccounts);
    }

    private async getEnabledExternalIds(): Promise<Set<string>> {
        const enabledSyncs = await bankSyncRepository.getEnabledByProvider(PROVIDER);
        if (!isNotEmptyArray(enabledSyncs)) {
            return new Set();
        }

        const accountIds = enabledSyncs.map(sync => sync.accountId);
        const accounts = await accountRepository.findByIds(accountIds);

        return new Set(accounts.map(account => account.externalId).filter(isDefined));
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
