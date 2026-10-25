import { consolidationScopeService } from '@budgie/consolidation';
import { AccountRepository, BankIntegrationRepository, Db, SyncModeEnum, SyncRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionImportService, TransactionService } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SyncWorkload } from '../port/sync-workload.port';
import { SyncOperationMetadataService } from '../service/sync-operation-metadata.service';

import { buildFileSyncImportReview } from './build-file-sync-import-review.util';
import { makeSyncService } from './make-sync-service.util';
import { mapBankTransactionToCreateInput } from './map-bank-transaction-to-create-input.util';

import type { FileBankSyncAccountImportResultInterface } from '../interface/file-bank-sync-account-import-result.interface';
import type { FileBankSyncImportResultInterface } from '../interface/file-bank-sync-import-result.interface';
import type { FileBasedSyncClientInterface } from '../interface/file-based-sync-client.interface';
import type { FileSyncServiceDefinitionInterface } from '../interface/file-sync-service-definition.interface';
import type { ImportContextInterface } from '../interface/import-context.interface';
import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

export const makeFileSyncService = Effect.fnUntraced(function* (definition: FileSyncServiceDefinitionInterface) {
    const syncWorkload = yield* SyncWorkload;
    const accountRepository = yield* AccountRepository;
    const bankIntegrationRepository = yield* BankIntegrationRepository;
    const syncRepository = yield* SyncRepository;
    const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
    const transactionImportService = yield* TransactionImportService;
    const transactionService = yield* TransactionService;
    const syncOperationMetadataService = yield* SyncOperationMetadataService;
    const ruleEngineService = yield* RuleEngineService;
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
                refilledTransactions: [],
                deferredRuleTransactionIds: [],
                deferredRuleTransactionInputs: [],
                parsedTransactionCount: 0
            } satisfies FileBankSyncAccountImportResultInterface;
        }
        const transactionInputs = yield* syncOperationMetadataService.applyToInputs(
            transactions.map(transaction => {
                const lookup = context.mccCategoryLookupMap.get(resolveMccCategoryLookupKey(transaction)) ?? null;

                return mapBankTransactionToCreateInput(transaction, account.id, lookup, definition.provider);
            }),
            transactions
        );
        const imported = transactionImportService.prepareImportedInputs(transactionInputs, context.existingTransactionIdMap);
        const wasNotPreviouslyImported = ({ externalId }: { externalId: string | null }) =>
            !isDefined(externalId) || !imported.externalIdMap.has(externalId);
        const newInputs = imported.transactionInputs.filter(wasNotPreviouslyImported);
        const ruled = yield* ruleEngineService.prepareCreateInputsForRules(newInputs);
        const ruledInputs = new Map(newInputs.map((input, index) => [input, ruled.transactionInputs[index]]));
        const prepared = {
            ...imported,
            transactionInputs: imported.transactionInputs.map(input => ruledInputs.get(input) ?? input)
        };

        const { transactions: upsertedTransactions, refilledTransactions } = yield* transactionImportService.bulkUpsertPreparedImported(
            prepared,
            { shouldUpdateBalances: false }
        );

        if (isNotEmptyArray(upsertedTransactions)) {
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([account.id]);
        }

        const newTransactions = upsertedTransactions.filter(wasNotPreviouslyImported);
        const inputsByExternalId = new Map(prepared.transactionInputs.map(input => [input.externalId, input]));
        const pairedRefills = refilledTransactions.flatMap(transaction => {
            const input = inputsByExternalId.get(transaction.externalId);

            return isDefined(input) && input.fromAccountId === transaction.fromAccountId && input.toAccountId === transaction.toAccountId
                ? [{ transaction, input }]
                : [];
        });

        return {
            newTransactions,
            refilledTransactions: pairedRefills.map(({ transaction }) => transaction),
            deferredRuleTransactionIds: [
                ...ruled.postCreateIndexes.map(index => newTransactions[index]?.id).filter(isDefined),
                ...pairedRefills.map(({ transaction }) => transaction.id)
            ],
            deferredRuleTransactionInputs: [
                ...ruled.postCreateIndexes.map(index => ruled.transactionInputs[index]).filter(isDefined),
                ...pairedRefills.map(({ input }) => input)
            ],
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

        const transactionsToProcess = accountImportResults.flatMap(result => [...result.newTransactions, ...result.refilledTransactions]);
        yield* syncWorkload.enqueueRuleApplication(
            accountImportResults.flatMap(result => result.deferredRuleTransactionIds),
            accountImportResults.flatMap(result => result.deferredRuleTransactionInputs)
        );
        const scope = consolidationScopeService.buildFromTransactions(transactionsToProcess);
        if (isDefined(scope)) {
            yield* syncWorkload.enqueueTransferConsolidation(scope);
        }

        return buildImportResult(bankAccounts.length, accountImportResults);
    });

    const parseFile = Effect.fnUntraced(function* (uri: string) {
        const { client, bankAccounts } = yield* definition.parseFile(uri);

        return { client, bankAccounts: yield* syncService.excludeExternalAccounts(bankAccounts) };
    });

    const executeImport = (client: FileBasedSyncClientInterface, bankAccounts: SyncAccountInterface[]) =>
        syncWorkload.runUser(importWork(client, bankAccounts));

    return {
        ...syncService,
        importPreview: Effect.fn('AbstractFileSyncService.importPreview')(function* (uri: string) {
            const { bankAccounts } = yield* parseFile(uri);

            if (!isNotEmptyArray(bankAccounts)) {
                return [];
            }

            return yield* syncService.mapAccountsToPreview(bankAccounts);
        }),
        reviewImport: Effect.fn('AbstractFileSyncService.reviewImport')(function* (uri: string, selectedAccountIds: string[]) {
            const { client, bankAccounts } = yield* parseFile(uri);
            const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));
            const existingTransactionIdMap = yield* transactionService.findIdMapByExternalSource(definition.provider);

            return buildFileSyncImportReview(client, selectedBankAccounts, existingTransactionIdMap);
        }),
        executeImportForSelectedAccounts: Effect.fn('AbstractFileSyncService.executeImportForSelectedAccounts')(function* (
            uri: string,
            selectedAccountIds: string[]
        ) {
            const { client, bankAccounts } = yield* parseFile(uri);
            const selectedBankAccounts = bankAccounts.filter(account => selectedAccountIds.includes(account.id));

            if (!isNotEmptyArray(selectedBankAccounts)) {
                return;
            }

            yield* executeImport(client, selectedBankAccounts);
        }),
        quickImport: Effect.fn('AbstractFileSyncService.quickImport')(function* (uri: string) {
            const { client, bankAccounts } = yield* parseFile(uri);

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
