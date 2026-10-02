import { consolidationScopeService } from '@budgie/consolidation';
import { AccountRepository, BankIntegrationRepository, Db, SyncModeEnum, SyncRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionImportService, TransactionService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { RuleApplicationDrainerService } from '../../rule/service/rule-application-drainer.service';
import { TransferConsolidationDrainerService } from '../service/transfer-consolidation-drainer.service';

import { makeSyncService } from './make-sync-service.util';
import { mapBankTransactionToCreateInput } from './map-bank-transaction-to-create-input.util';

import type { FileBankSyncAccountImportResultInterface } from '../interface/file-bank-sync-account-import-result.interface';
import type { FileBankSyncImportResultInterface } from '../interface/file-bank-sync-import-result.interface';
import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { FileSyncServiceDefinitionInterface } from '../interface/file-sync-service-definition.interface';
import type { ImportContextInterface } from '../interface/import-context.interface';
import type { AccountEntityInterface } from '@budgie/contracts';
import type { SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

export const makeFileSyncService = Effect.fnUntraced(function* (definition: FileSyncServiceDefinitionInterface) {
    const workload = yield* Workload;
    const accountRepository = yield* AccountRepository;
    const bankIntegrationRepository = yield* BankIntegrationRepository;
    const syncRepository = yield* SyncRepository;
    const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
    const ruleApplicationDrainerService = yield* RuleApplicationDrainerService;
    const transactionImportService = yield* TransactionImportService;
    const transactionService = yield* TransactionService;
    const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
    const syncService = yield* makeSyncService(definition);
    const resolveMccCategoryLookupKey =
        definition.resolveMccCategoryLookupKey ?? ((transaction: SyncTransactionInterface) => transaction.category ?? '');

    const buildImportResult = (
        accountCount: number,
        accountImportResults: FileBankSyncAccountImportResultInterface[]
    ): FileBankSyncImportResultInterface => {
        const parsedTransactionCount = accountImportResults.reduce((total, result) => total + result.parsedTransactionCount, 0);
        const newTransactionCount = accountImportResults.reduce((total, result) => total + result.newTransactions.length, 0);

        return {
            accountCount,
            existingTransactionCount: parsedTransactionCount - newTransactionCount,
            newTransactionCount,
            parsedTransactionCount
        };
    };

    const createBankSyncRecord = Effect.fnUntraced(function* (accountId: number) {
        const existingSync = yield* syncRepository.getByAccountId(accountId);
        if (isDefined(existingSync)) {
            return;
        }

        yield* syncRepository.create({
            accountId,
            provider: definition.provider,
            enabled: true,
            mode: SyncModeEnum.FORWARD
        });
    });

    const linkFileImportIntegration = Effect.fnUntraced(function* (account: AccountEntityInterface) {
        if (isDefined(account.integrationId)) {
            return;
        }

        const existingIntegration = yield* bankIntegrationRepository.findFileImportIntegration(definition.provider);
        const integration = existingIntegration ?? (yield* bankIntegrationRepository.create({ provider: definition.provider, token: '' }));

        yield* accountRepository.updateById(account.id, { integrationId: integration.id });
    });

    const prepareImportAccount = Effect.fnUntraced(function* (bankAccount: SyncAccountInterface) {
        const account = yield* syncService.getOrCreateSyncAccount(bankAccount);
        yield* createBankSyncRecord(account.id);
        yield* linkFileImportIntegration(account);

        return account;
    });

    const getEnabledExternalIds = Effect.fnUntraced(function* () {
        const enabledSyncs = yield* syncRepository.getEnabledByProvider(definition.provider);
        if (!isNotEmptyArray(enabledSyncs)) {
            return new Set<string>();
        }

        const accounts = yield* accountRepository.findByIds(enabledSyncs.map(sync => sync.accountId));

        return new Set(accounts.map(account => account.externalId).filter(isDefined));
    });

    const importAccountTransactions = Effect.fnUntraced(function* (
        client: FileBasedSyncClientInterface,
        bankAccount: SyncAccountInterface,
        context: ImportContextInterface
    ) {
        const account = yield* prepareImportAccount(bankAccount);

        const transactions = client.getTransactions(bankAccount.id);
        if (!isNotEmptyArray(transactions)) {
            return {
                newTransactions: [],
                newTransactionInputs: [],
                parsedTransactionCount: 0
            } satisfies FileBankSyncAccountImportResultInterface;
        }
        const transactionInputs = transactions.map(transaction => {
            const lookup = context.mccCategoryLookupMap.get(resolveMccCategoryLookupKey(transaction)) ?? null;

            return mapBankTransactionToCreateInput(transaction, account.id, lookup, definition.provider);
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

    const importAccounts = Effect.fnUntraced(function* (
        client: FileBasedSyncClientInterface,
        bankAccounts: SyncAccountInterface[],
        context: ImportContextInterface
    ) {
        const accountImportResults: FileBankSyncAccountImportResultInterface[] = [];

        for (const bankAccount of bankAccounts) {
            accountImportResults.push(yield* importAccountTransactions(client, bankAccount, context));
            yield* Effect.yieldNow;
        }

        return accountImportResults;
    });

    const importWork = Effect.fnUntraced(function* (client: FileBasedSyncClientInterface, bankAccounts: SyncAccountInterface[]) {
        const [mccCategoryLookupMap, existingTransactionIdMap] = yield* Effect.all([
            definition.resolveMccCategoryIdMap(client, bankAccounts),
            transactionService.findIdMapByExternalSource(definition.provider)
        ]);
        const context: ImportContextInterface = { mccCategoryLookupMap, existingTransactionIdMap };
        const accountImportResults = yield* Db.transaction(importAccounts(client, bankAccounts, context));

        const newlyImportedTransactions = accountImportResults.flatMap(result => result.newTransactions);
        yield* ruleApplicationDrainerService.enqueueTransactions(
            newlyImportedTransactions.map(transaction => transaction.id),
            accountImportResults.flatMap(result => result.newTransactionInputs)
        );
        const scope = consolidationScopeService.buildFromTransactions(newlyImportedTransactions);
        if (isDefined(scope)) {
            yield* transferConsolidationDrainerService.enqueue(scope);
        }

        return buildImportResult(bankAccounts.length, accountImportResults);
    });

    const executeImport = (client: FileBasedSyncClientInterface, bankAccounts: SyncAccountInterface[]) =>
        workload.runUser(importWork(client, bankAccounts));

    return {
        ...syncService,
        importPreview: Effect.fn('AbstractFileSyncService.importPreview')(function* (uri: string) {
            const { bankAccounts } = yield* definition.parseFile(uri);

            if (!isNotEmptyArray(bankAccounts)) {
                return [];
            }

            return yield* syncService.mapAccountsToPreview(bankAccounts);
        }),
        executeImportForSelectedAccounts: Effect.fn('AbstractFileSyncService.executeImportForSelectedAccounts')(function* (
            uri: string,
            selectedAccountIds: string[]
        ) {
            const { client, bankAccounts } = yield* definition.parseFile(uri);
            const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

            if (!isNotEmptyArray(selectedBankAccounts)) {
                return;
            }

            yield* executeImport(client, selectedBankAccounts);
        }),
        quickImport: Effect.fn('AbstractFileSyncService.quickImport')(function* (uri: string) {
            const { client, bankAccounts } = yield* definition.parseFile(uri);

            if (!isNotEmptyArray(bankAccounts)) {
                return buildImportResult(0, []);
            }

            const enabledExternalIds = yield* getEnabledExternalIds();
            const enabledBankAccounts = bankAccounts.filter(account => enabledExternalIds.has(account.id));
            if (!isNotEmptyArray(enabledBankAccounts)) {
                return buildImportResult(0, []);
            }

            return yield* executeImport(client, enabledBankAccounts);
        })
    };
});
