import { consolidationScopeService } from '@budgie/consolidation';
import { Db, SyncModeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, bankIntegrationRepository, syncRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { Workload } from '../../@generic/service/workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { ruleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { transactionImportService } from '../../transaction/service/transaction-import.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { FileBankSyncAccountImportResultInterface } from '../interface/file-bank-sync-account-import-result.interface';
import { FileBankSyncImportResultInterface } from '../interface/file-bank-sync-import-result.interface';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractSyncService } from './abstract-sync.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { ImportContextInterface } from '../interface/import-context.interface';
import type { ParsedFileResultInterface } from '../interface/parsed-file-result.interface';
import type { AccountEntityInterface, DbError, MccCategoryLookupInterface } from '@budgie/contracts';
import type { SyncAccountInterface, SyncError, SyncTransactionInterface } from '@budgie/sync';

export abstract class AbstractFileSyncService extends AbstractSyncService {
    override readonly supportsFileImport: boolean = true;

    readonly importPreview = Effect.fn('AbstractFileSyncService.importPreview')(function* (this: AbstractFileSyncService, uri: string) {
        const { bankAccounts } = yield* this.parseFile(uri);

        if (!isNotEmptyArray(bankAccounts)) {
            return [];
        }

        return yield* this.mapAccountsToPreview(bankAccounts);
    });

    readonly executeImportForSelectedAccounts = Effect.fn('AbstractFileSyncService.executeImportForSelectedAccounts')(function* (
        this: AbstractFileSyncService,
        uri: string,
        selectedAccountIds: string[]
    ) {
        const { client, bankAccounts } = yield* this.parseFile(uri);
        const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

        if (!isNotEmptyArray(selectedBankAccounts)) {
            return;
        }

        yield* this.executeImport(client, selectedBankAccounts);
    });

    readonly quickImport = Effect.fn('AbstractFileSyncService.quickImport')(function* (this: AbstractFileSyncService, uri: string) {
        const { client, bankAccounts } = yield* this.parseFile(uri);

        if (!isNotEmptyArray(bankAccounts)) {
            return this.buildEmptyImportResult(0);
        }

        const enabledExternalIds = yield* this.getEnabledExternalIds();
        if (enabledExternalIds.size === 0) {
            return this.buildEmptyImportResult(0);
        }

        const enabledBankAccounts = this.getEnabledBankAccounts(bankAccounts, enabledExternalIds);
        if (!isNotEmptyArray(enabledBankAccounts)) {
            return this.buildEmptyImportResult(0);
        }

        return yield* this.executeImport(client, enabledBankAccounts);
    });

    private readonly importAccountTransactions = Effect.fnUntraced(function* (
        this: AbstractFileSyncService,
        client: FileBasedSyncClientInterface,
        bankAccount: SyncAccountInterface,
        context: ImportContextInterface
    ) {
        const account = yield* this.prepareImportAccount(bankAccount);

        const transactions = client.getTransactions(bankAccount.id);
        if (!isNotEmptyArray(transactions)) {
            return {
                newTransactions: [],
                newTransactionInputs: [],
                parsedTransactionCount: 0
            } satisfies FileBankSyncAccountImportResultInterface;
        }
        const transactionInputs = transactions.map(transaction => {
            const lookup = context.mccCategoryLookupMap.get(this.resolveMccCategoryLookupKey(transaction)) ?? null;

            return mapBankTransactionToCreateInput(transaction, account.id, lookup, this.provider);
        });
        const prepared = transactionImportService.prepareImportedInputs(transactionInputs, context.existingTransactionIdMap);

        const upsertedTransactions = yield* transactionImportService.bulkUpsertPreparedImported(prepared, {
            shouldUpdateBalances: false
        });

        if (isNotEmptyArray(upsertedTransactions)) {
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([account.id]);
        }

        const wasNotPreviouslyImported = ({ externalId }: { externalId: string | null }) =>
            !isDefined(externalId) || !prepared.externalIdMap.has(externalId);

        return {
            newTransactions: upsertedTransactions.filter(wasNotPreviouslyImported),
            newTransactionInputs: prepared.transactionInputs.filter(wasNotPreviouslyImported),
            parsedTransactionCount: transactionInputs.length
        } satisfies FileBankSyncAccountImportResultInterface;
    });

    private readonly importWork = Effect.fnUntraced(function* (
        this: AbstractFileSyncService,
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ) {
        const [mccCategoryLookupMap, existingTransactionIdMap] = yield* Effect.all([
            this.resolveMccCategoryIdMap(client, bankAccounts),
            transactionService.findIdMapByExternalSource(this.provider)
        ]);
        const context: ImportContextInterface = { mccCategoryLookupMap, existingTransactionIdMap };
        const accountImportResults = yield* Db.transaction(this.importAccounts(client, bankAccounts, context));

        const newlyImportedTransactions = accountImportResults.flatMap(result => result.newTransactions);
        yield* ruleApplicationDrainerService.enqueueTransactions(
            newlyImportedTransactions.map(transaction => transaction.id),
            accountImportResults.flatMap(result => result.newTransactionInputs)
        );
        const scope = consolidationScopeService.buildFromTransactions(newlyImportedTransactions);
        if (isDefined(scope)) {
            yield* transferConsolidationDrainerService.enqueue(scope);
        }

        return this.buildImportResult(bankAccounts.length, accountImportResults);
    });

    private readonly importAccounts = Effect.fnUntraced(function* (
        this: AbstractFileSyncService,
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[],
        context: ImportContextInterface
    ) {
        const accountImportResults: FileBankSyncAccountImportResultInterface[] = [];

        for (const bankAccount of bankAccounts) {
            accountImportResults.push(yield* this.importAccountTransactions(client, bankAccount, context));
            yield* Effect.yieldNow;
        }

        return accountImportResults;
    });

    private readonly executeImport = Effect.fnUntraced(function* (
        this: AbstractFileSyncService,
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ) {
        return yield* Workload.use(workload => workload.runUser(this.importWork(client, bankAccounts)));
    }, invalidateDatabaseLiveQuery);

    private readonly prepareImportAccount = Effect.fnUntraced(function* (this: AbstractFileSyncService, bankAccount: SyncAccountInterface) {
        const account = yield* this.getOrCreateSyncAccount(bankAccount);
        yield* this.createBankSyncRecord(account.id);
        yield* this.linkFileImportIntegration(account);

        return account;
    });

    private readonly linkFileImportIntegration = Effect.fnUntraced(function* (
        this: AbstractFileSyncService,
        account: AccountEntityInterface
    ) {
        if (isDefined(account.integrationId)) {
            return;
        }

        const existingIntegration = yield* bankIntegrationRepository.findFileImportIntegration(this.provider);
        const integration = existingIntegration ?? (yield* bankIntegrationRepository.create({ provider: this.provider, token: '' }));

        yield* accountRepository.updateById(account.id, { integrationId: integration.id });
    });

    private readonly getEnabledExternalIds = Effect.fnUntraced(function* (this: AbstractFileSyncService) {
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(this.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return new Set<string>();
        }

        const accountIds = enabledSyncs.map(sync => sync.accountId);
        const accounts = yield* accountRepository.findByIds(accountIds);

        return new Set(accounts.map(account => account.externalId).filter(isDefined));
    });

    private readonly createBankSyncRecord = Effect.fnUntraced(function* (this: AbstractFileSyncService, accountId: number) {
        const existingSync = yield* syncRepository.getByAccountId(accountId);
        if (isDefined(existingSync)) {
            return;
        }

        yield* syncRepository.create({
            accountId,
            provider: this.provider,
            enabled: true,
            mode: SyncModeEnum.FORWARD
        });
    });

    protected abstract readonly parseFile: (uri: string) => Effect.Effect<ParsedFileResultInterface, SyncError>;

    protected abstract readonly resolveMccCategoryIdMap: (
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[]
    ) => Effect.Effect<Map<string, MccCategoryLookupInterface | null>, DbError, Db>;

    protected resolveMccCategoryLookupKey(transaction: SyncTransactionInterface): string {
        return transaction.category ?? '';
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
}
