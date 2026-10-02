import { consolidationScopeService } from '@budgie/consolidation';
import {
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    Db,
    ExternalSourceEnum,
    MccCategoryRepository,
    SettingsRepository,
    SyncModeEnum,
    SyncRepository,
    TransactionRepository,
    UserIconNameEnum
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, TransactionService, convertToMicroUnits } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import { subSeconds } from 'date-fns/subSeconds';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { UNKNOWN_SYNC_ERROR } from '../../core/constant/unknown-sync-error.constant';
import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncHistoryDepthEnum } from '../../core/enum/sync-history-depth.enum';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { SyncIntegrationTokenService } from '../../core/service/sync-integration-token.service';
import { TransferConsolidationService } from '../../core/service/transfer-consolidation.service';
import { loadMccCategoryLookupMap } from '../../core/util/load-mcc-category-lookup-map.util';
import { makePollingSyncService } from '../../core/util/make-polling-sync-service.util';
import { mapBankTransactionToCreateInput } from '../../core/util/map-bank-transaction-to-create-input.util';
import { resolveSyncProgressUpdate } from '../../core/util/resolve-sync-progress-update.util';
import { MonobankClient } from '../client/monobank.client';
import { MONOBANK_RATE_LIMIT_MS } from '../constant/monobank-rate-limit-ms.constant';
import { MONOBANK_SYNC_TASK } from '../constant/monobank-sync-task.constant';

import { MonobankTransactionSyncService } from './monobank-transaction-sync.service';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncBatchResultInterface } from '../../core/interface/sync-batch-result.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { MccCategoryLookupInterface, SyncEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

export class MonobankSyncService extends Context.Service<MonobankSyncService>()('@budgie/sync/MonobankSyncService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const syncRepository = yield* SyncRepository;
        const transactionRepository = yield* TransactionRepository;
        const mccCategoryRepository = yield* MccCategoryRepository;
        const settingsRepository = yield* SettingsRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const ruleEngineService = yield* RuleEngineService;
        const transactionService = yield* TransactionService;
        const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
        const syncWorkload = yield* SyncWorkload;
        const transferConsolidationService = yield* TransferConsolidationService;
        const provider = ExternalSourceEnum.MONOBANK;
        const providerTitle = 'Monobank';
        let mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();

        const mapBankTransaction = (bankTransaction: SyncTransactionInterface, accountId: number) =>
            mapBankTransactionToCreateInput(
                bankTransaction,
                accountId,
                mccCategoryLookupMap.get(String(bankTransaction.mcc)) ?? null,
                provider
            );

        const getOwnBalance = (bankAccount: SyncAccountInterface): number =>
            convertToMicroUnits(bankAccount.balance) - convertToMicroUnits(bankAccount.creditLimit);

        const buildExistingTransactionScopeSeeds = (
            transactions: SyncTransactionInterface[],
            existingTransactionIdMap: Map<string, number>
        ): Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[] =>
            transactions.flatMap(transaction => {
                const id = existingTransactionIdMap.get(transaction.id);

                return isDefined(id) ? [{ id, operatedAt: new Date(transaction.time * 1000) }] : [];
            });

        const generateAccountTitle = (account: SyncAccountInterface): string => {
            if (account.type === SyncAccountTypeEnum.JAR && isNotEmptyString(account.title)) {
                return `${providerTitle} «${account.title}»`;
            }

            const cardType = account.type.charAt(0).toUpperCase() + account.type.slice(1).toLowerCase();

            if (isNotEmptyArray(account.maskedPan)) {
                const lastFourDigits = account.maskedPan[0].slice(-4);

                return `${providerTitle} ${cardType} •${lastFourDigits}`;
            }

            return `${providerTitle} ${cardType} ${account.currencyCode}`;
        };

        const completeBackwardHistory = Effect.fn('AppMonobankSyncService.completeBackwardHistory')(
            function* (sync: SyncEntityInterface, setupBalance: number, result: SyncBatchResultInterface) {
                const setupAt = sync.forwardSyncFromAt ?? new Date();
                const oldestTransactionAt = yield* transactionService.getEarliestTransactionTimeByAccountId(sync.accountId);
                const openingBalanceAt = isDefined(oldestTransactionAt) ? subSeconds(oldestTransactionAt, 1) : setupAt;

                if (isDefined(sync.balanceAdjustmentTransactionId)) {
                    yield* transactionRepository.deleteById(sync.balanceAdjustmentTransactionId);
                }

                const delta = setupBalance - (yield* accountBalanceRepository.getLedgerBalanceUntil(sync.accountId, setupAt));
                const balanceAdjustmentTransactionId =
                    delta === 0 ? null : yield* transactionService.createBalanceAdjustment(sync.accountId, delta, openingBalanceAt);

                yield* syncRepository.update(sync.id, {
                    ...resolveSyncProgressUpdate(sync, result),
                    setupBalance: null,
                    balanceAdjustmentTransactionId
                });
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([sync.accountId]);
            },
            effect => Db.transaction(effect)
        );

        const reconcileChangedTransactions = Effect.fnUntraced(function* (
            changedTransactions: Array<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>>
        ) {
            const consolidationScope = consolidationScopeService.buildFromTransactions(changedTransactions);
            if (!isDefined(consolidationScope)) {
                return;
            }

            yield* Effect.ensuring(
                transferConsolidationService.consolidate(consolidationScope),
                syncWorkload.enqueueTransferConsolidation(consolidationScope)
            );
        });

        const createNewTransactions = Effect.fnUntraced(function* (newTransactions: SyncTransactionInterface[], accountId: number) {
            if (!isNotEmptyArray(newTransactions)) {
                return [];
            }

            const prepared = yield* ruleEngineService.prepareCreateInputsForRules(
                newTransactions.map(bankTransaction => mapBankTransaction(bankTransaction, accountId))
            );
            const createdTransactions = yield* transactionService.bulkCreate(prepared.transactionInputs);
            const postCreateTransactionIds = prepared.postCreateIndexes.map(index => createdTransactions[index]?.id).filter(isDefined);
            const postCreateTransactionInputs = prepared.postCreateIndexes
                .map(index => prepared.transactionInputs[index])
                .filter(isDefined);

            if (isNotEmptyArray(postCreateTransactionIds)) {
                yield* syncWorkload.enqueueRuleApplication(postCreateTransactionIds, postCreateTransactionInputs);
            }

            return createdTransactions;
        });

        const processFetchedTransactions = Effect.fnUntraced(function* (transactions: SyncTransactionInterface[], accountId: number) {
            if (!isNotEmptyArray(transactions)) {
                return [];
            }

            const existingTransactionIdMap = yield* transactionService.findIdMapByExternalSource(provider);
            const newTransactions = transactions.filter(bankTransaction => !existingTransactionIdMap.has(bankTransaction.id));
            const existingTransactions = transactions.filter(bankTransaction => existingTransactionIdMap.has(bankTransaction.id));

            const createdTransactions = yield* createNewTransactions(newTransactions, accountId);
            if (isNotEmptyArray(existingTransactions)) {
                yield* transactionService.bulkUpdateImported(
                    existingTransactions.map(bankTransaction => mapBankTransaction(bankTransaction, accountId))
                );
                yield* transactionService.updateAllBalances();
            }

            return [...createdTransactions, ...buildExistingTransactionScopeSeeds(existingTransactions, existingTransactionIdMap)];
        });

        const fetchTransactionBatch = Effect.fnUntraced(function* (sync: SyncEntityInterface, externalAccountId: string, token: string) {
            const service = new MonobankTransactionSyncService(new MonobankClient(token));

            return sync.mode === SyncModeEnum.FORWARD
                ? yield* service.syncTransactionsForward(externalAccountId, sync.forwardSyncFromAt ?? new Date())
                : yield* service.syncTransactionsBackward(
                      externalAccountId,
                      sync.backwardSyncFromAt ?? new Date(),
                      sync.backwardSyncedAt,
                      sync.backwardSyncLimitAt
                  );
        });

        const fetchBankAccountsAndJars = Effect.fnUntraced(function* (token: string) {
            const client = new MonobankClient(token);
            const accounts = yield* client.getAccounts();
            const jars = yield* client.getJars();

            return [...accounts, ...jars];
        });

        const pollingSyncService = yield* makePollingSyncService({
            provider,
            accountType: AccountTypeEnum.BANK_SYNC,
            rateLimitMs: MONOBANK_RATE_LIMIT_MS,
            backgroundTaskName: MONOBANK_SYNC_TASK,
            shouldRequestSyncWhenEnabled: true,
            generateAccountTitle,
            accountIcon: account => (account.type === SyncAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark),
            executeSyncBatch: Effect.fn('AppMonobankSyncService.executeSyncBatch')(function* (sync: SyncEntityInterface) {
                const account = yield* accountRepository.findById(sync.accountId);
                if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
                    const now = new Date();

                    return { transactions: [], nextTo: now, nextFrom: now, completed: true };
                }

                const result = yield* fetchTransactionBatch(
                    sync,
                    account.externalId,
                    yield* syncIntegrationTokenService.resolveAccountToken(provider, sync.accountId)
                );
                yield* Effect.yieldNow;
                const changedTransactions = yield* processFetchedTransactions(result.transactions, account.id);
                yield* reconcileChangedTransactions(changedTransactions);
                yield* Effect.yieldNow;

                return result;
            }),
            beforeSyncRun: Effect.fn('AppMonobankSyncService.beforeSyncRun')(function* () {
                mccCategoryLookupMap = yield* loadMccCategoryLookupMap(mccCategoryRepository, settingsRepository);
            }),
            applyProgressUpdate: (sync, result) =>
                sync.mode === SyncModeEnum.BACKWARD && result.completed && isDefined(sync.setupBalance)
                    ? completeBackwardHistory(sync, sync.setupBalance, result)
                    : Effect.asVoid(syncRepository.update(sync.id, resolveSyncProgressUpdate(sync, result)))
        });

        return {
            ...pollingSyncService,
            fetchAccountsPreview: Effect.fn('AppMonobankSyncService.fetchAccountsPreview')(function* (token: string) {
                const bankAccounts = yield* fetchBankAccountsAndJars(token);

                return isNotEmptyArray(bankAccounts) ? yield* pollingSyncService.mapAccountsToPreview(bankAccounts) : [];
            }),
            setupAccountSyncBatch: Effect.fn('AppMonobankSyncService.setupAccountSyncBatch')(function* (
                token: string,
                externalIds: string[],
                historyDepth: SyncHistoryDepthEnum = SyncHistoryDepthEnum.FULL
            ) {
                const bankAccounts = yield* fetchBankAccountsAndJars(token);

                for (const externalId of externalIds) {
                    const bankAccount = bankAccounts.find(account => account.id === externalId);
                    if (isDefined(bankAccount)) {
                        const account = yield* pollingSyncService.getOrCreateSyncAccount(bankAccount);
                        yield* pollingSyncService.createOrUpdateSync(account.id, token, historyDepth, getOwnBalance(bankAccount));
                    }
                }

                yield* Effect.forkDetach(pollingSyncService.registerBackgroundTask().pipe(Effect.ignoreCause({ log: true })));
                yield* pollingSyncService.requestSync();
            }),
            fetchSetupBalance: Effect.fn('AppMonobankSyncService.fetchSetupBalance')(function* (accountId: number) {
                const account = yield* accountRepository.findById(accountId);
                const token = yield* syncIntegrationTokenService.resolveAccountToken(provider, accountId);
                const bankAccounts = yield* fetchBankAccountsAndJars(token);
                const bankAccount = bankAccounts.find(item => item.id === account?.externalId);
                if (!isDefined(bankAccount)) {
                    return yield* Effect.die(new Error(UNKNOWN_SYNC_ERROR));
                }

                return getOwnBalance(bankAccount);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(MonobankSyncService, MonobankSyncService.make).pipe(
        Layer.provide([
            pollingSyncDependenciesLayer,
            MccCategoryRepository.layer,
            SettingsRepository.layer,
            AccountBalanceIncrementalService.layer,
            RuleEngineService.layer,
            TransferConsolidationService.layer
        ])
    );
}
