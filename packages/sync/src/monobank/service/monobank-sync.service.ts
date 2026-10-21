import { consolidationScopeService } from '@budgie/consolidation';
import {
    loadMccCategoryLookupMap,
    AccountBalanceRepository,
    AccountRepository,
    AccountTypeEnum,
    BankIntegrationRepository,
    Db,
    ExternalSourceEnum,
    MccCategoryRepository,
    SettingsRepository,
    SyncModeEnum,
    SyncRepository,
    TransactionRepository,
    UserIconNameEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { AccountBalanceIncrementalService, BalanceAdjustmentService, TransactionService } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import { addMonths } from 'date-fns/addMonths';
import { addSeconds } from 'date-fns/addSeconds';
import { fromUnixTime } from 'date-fns/fromUnixTime';
import { getUnixTime } from 'date-fns/getUnixTime';
import { max } from 'date-fns/max';
import { min } from 'date-fns/min';
import { subSeconds } from 'date-fns/subSeconds';
import * as Cache from 'effect/Cache';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { UNKNOWN_SYNC_ERROR } from '../../core/constant/unknown-sync-error.constant';
import { SyncAccountTypeEnum } from '../../core/enum/sync-account-type.enum';
import { SyncHistoryDepthEnum } from '../../core/enum/sync-history-depth.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTokenClientMismatchError } from '../../core/error/sync-token-client-mismatch.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { SyncBalanceReconciliationService } from '../../core/service/sync-balance-reconciliation.service';
import { SyncIntegrationTokenService } from '../../core/service/sync-integration-token.service';
import { SyncOperationMetadataService } from '../../core/service/sync-operation-metadata.service';
import { TransferConsolidationService } from '../../core/service/transfer-consolidation.service';
import { makePollingSyncAccountSetup } from '../../core/utils/make-polling-sync-account-setup.util';
import { makePollingSyncService } from '../../core/utils/make-polling-sync-service.util';
import { mapBankTransactionToCreateInput } from '../../core/utils/map-bank-transaction-to-create-input.util';
import { resolveSyncProgressUpdate } from '../../core/utils/resolve-sync-progress-update.util';
import { MonobankClient } from '../client/monobank.client';
import { MONOBANK_MAX_PERIOD_SECONDS } from '../constant/monobank-max-period-seconds.constant';
import { MONOBANK_RATE_LIMIT_MS } from '../constant/monobank-rate-limit-ms.constant';
import { MonobankConnectionResultEnum } from '../enum/monobank-connection-result.enum';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncBatchResultInterface } from '../../core/interface/sync-batch-result.interface';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { MonobankConnectionResultType } from '../interface/monobank-connection-result.type';
import type { MccCategoryLookupInterface, SyncEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

export class MonobankSyncService extends Context.Service<MonobankSyncService>()('@budgie/sync/MonobankSyncService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const syncRepository = yield* SyncRepository;
        const transactionRepository = yield* TransactionRepository;
        const mccCategoryRepository = yield* MccCategoryRepository;
        const settingsRepository = yield* SettingsRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const ruleEngineService = yield* RuleEngineService;
        const transactionService = yield* TransactionService;
        const balanceAdjustmentService = yield* BalanceAdjustmentService;
        const syncBalanceReconciliationService = yield* SyncBalanceReconciliationService;
        const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
        const syncWorkload = yield* SyncWorkload;
        const syncOperationMetadataService = yield* SyncOperationMetadataService;
        const transferConsolidationService = yield* TransferConsolidationService;
        const provider = ExternalSourceEnum.MONOBANK;
        const createOrUpdateSync = yield* makePollingSyncAccountSetup(provider);
        const providerTitle = 'Monobank';
        const maxTransactionsPerRequest = 500;
        const dormancyMonths = 3;
        let mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();

        const mapBankTransactions = (bankTransactions: SyncTransactionInterface[], accountId: number) =>
            syncOperationMetadataService.applyToInputs(
                bankTransactions.map(bankTransaction => {
                    const input = mapBankTransactionToCreateInput(
                        bankTransaction,
                        accountId,
                        mccCategoryLookupMap.get(String(bankTransaction.mcc)) ?? null,
                        provider
                    );
                    const providerBalance = convertToMicroUnits(bankTransaction.balance);

                    return {
                        ...input,
                        entries: input.entries.map(entry =>
                            entry.externalId === bankTransaction.id ? { ...entry, providerBalance } : entry
                        )
                    };
                }),
                bankTransactions
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

        const completeBackwardHistory = Effect.fn('MonobankSyncService.completeBackwardHistory')(
            function* (sync: SyncEntityInterface, setupBalance: number, result: SyncBatchResultInterface) {
                const setupAt = sync.forwardSyncFromAt ?? new Date();
                const oldestTransactionAt = yield* transactionService.getEarliestTransactionTimeByAccountId(sync.accountId);
                const openingBalanceAt = isDefined(oldestTransactionAt) ? subSeconds(oldestTransactionAt, 1) : setupAt;

                const currentSync = (yield* syncRepository.getById(sync.id)) ?? sync;

                for (const transactionId of [currentSync.balanceAdjustmentTransactionId, currentSync.reconciliationTransactionId].filter(
                    isDefined
                )) {
                    yield* transactionRepository.deleteById(transactionId);
                }

                const delta = setupBalance - (yield* accountBalanceRepository.getLedgerBalanceUntil(sync.accountId, setupAt));
                const balanceAdjustmentTransactionId =
                    delta === 0 ? null : yield* balanceAdjustmentService.create(sync.accountId, delta, openingBalanceAt);

                yield* syncRepository.update(sync.id, {
                    ...resolveSyncProgressUpdate(sync, result),
                    setupBalance: null,
                    balanceAdjustmentTransactionId,
                    reconciledAt: null,
                    reconciledBalance: null,
                    reconciliationTransactionId: null
                });
                yield* accountBalanceIncrementalService.updateBalancesByAccountIds([sync.accountId]);
            },
            effect => Db.transaction(effect)
        );

        const updateProgressAndReconcile = Effect.fnUntraced(function* (sync: SyncEntityInterface, result: SyncBatchResultInterface) {
            yield* syncRepository.update(sync.id, resolveSyncProgressUpdate(sync, result));
            if (sync.mode === SyncModeEnum.FORWARD && result.completed && isDefined(result.balanceSnapshot)) {
                yield* syncBalanceReconciliationService.reconcile(sync.accountId, result.balanceSnapshot);
            }
        });

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

            const prepared = yield* ruleEngineService.prepareCreateInputsForRules(yield* mapBankTransactions(newTransactions, accountId));
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
                yield* transactionService.bulkUpdateImported(yield* mapBankTransactions(existingTransactions, accountId));
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            }

            return [...createdTransactions, ...buildExistingTransactionScopeSeeds(existingTransactions, existingTransactionIdMap)];
        });

        const hasMoreTransactions = (transactions: SyncTransactionInterface[]): boolean =>
            transactions.length === maxTransactionsPerRequest;

        const getNextTimeFromTransaction = (transaction: SyncTransactionInterface): Date => addSeconds(fromUnixTime(transaction.time), -1);

        const fetchBalanceSnapshot = (client: MonobankClient, accountId: string) => {
            const at = fromUnixTime(getUnixTime(new Date()));

            return Effect.all([client.getAccounts(), client.getJars()]).pipe(
                Effect.map(([accounts, jars]) => {
                    const bankAccount = [...accounts, ...jars].find(item => item.id === accountId);

                    return isDefined(bankAccount) ? { at, balance: getOwnBalance(bankAccount) } : null;
                }),
                Effect.orElseSucceed(() => null)
            );
        };

        const syncTransactionsForward = Effect.fnUntraced(function* (client: MonobankClient, accountId: string, from: Date) {
            const balanceSnapshot =
                addSeconds(from, MONOBANK_MAX_PERIOD_SECONDS) >= new Date() ? yield* fetchBalanceSnapshot(client, accountId) : null;
            const now = new Date();
            const to = min([now, addSeconds(from, MONOBANK_MAX_PERIOD_SECONDS)]);
            const transactions = yield* client.getTransactions(accountId, getUnixTime(from), getUnixTime(to));
            const oldestTransaction = transactions.at(-1);

            if (hasMoreTransactions(transactions) && isDefined(oldestTransaction)) {
                return { nextFrom: getNextTimeFromTransaction(oldestTransaction), nextTo: to, transactions, completed: false };
            }

            return { nextFrom: to, nextTo: to, transactions, completed: to >= now, balanceSnapshot };
        });

        const syncTransactionsBackward = Effect.fnUntraced(function* (
            client: MonobankClient,
            accountId: string,
            sync: SyncEntityInterface
        ) {
            const to = sync.backwardSyncFromAt ?? new Date();
            const limitAt = sync.backwardSyncLimitAt;
            const firstEmptyFromInStreak = sync.backwardSyncedAt;

            if (isDefined(limitAt) && to <= limitAt) {
                return { nextTo: to, nextFrom: to, transactions: [], completed: true };
            }

            const windowFrom = addSeconds(to, -MONOBANK_MAX_PERIOD_SECONDS);
            const from = isDefined(limitAt) ? max([windowFrom, limitAt]) : windowFrom;
            const transactions = yield* client
                .getTransactions(accountId, getUnixTime(from), getUnixTime(to))
                .pipe(Effect.catchTag('SyncInvalidResponseError', () => Effect.succeed<SyncTransactionInterface[]>([])));
            const oldestTransaction = transactions.at(-1);

            if (hasMoreTransactions(transactions) && isDefined(oldestTransaction)) {
                return { nextTo: getNextTimeFromTransaction(oldestTransaction), nextFrom: from, transactions, completed: false };
            }

            const reachedHistoryLimit = isDefined(limitAt) && from <= limitAt;
            const reachedDormancyBoundary =
                isEmptyArray(transactions) &&
                isDefined(firstEmptyFromInStreak) &&
                from <= addMonths(firstEmptyFromInStreak, -dormancyMonths);

            return {
                nextTo: from,
                nextFrom: addSeconds(from, -MONOBANK_MAX_PERIOD_SECONDS),
                transactions,
                completed: reachedHistoryLimit || reachedDormancyBoundary
            };
        });

        const loadedClientCache = yield* Cache.makeWith(
            (token: string) => {
                const client = new MonobankClient(token);

                return Effect.as(client.getAccounts(), client);
            },
            { capacity: 16, timeToLive: exit => (Exit.isSuccess(exit) ? MONOBANK_RATE_LIMIT_MS : 0) }
        );

        const loadClient = (token: string) => Cache.get(loadedClientCache, token);

        const fetchBankAccountsAndJars = Effect.fnUntraced(function* (client: MonobankClient) {
            const accounts = yield* client.getAccounts();
            const jars = yield* client.getJars();

            return [...accounts, ...jars];
        });

        const pollingSyncService = yield* makePollingSyncService({
            provider,
            accountType: AccountTypeEnum.BANK_SYNC,
            rateLimitMs: MONOBANK_RATE_LIMIT_MS,
            shouldRequestSyncWhenEnabled: true,
            generateAccountTitle,
            accountIcon: account => (account.type === SyncAccountTypeEnum.JAR ? UserIconNameEnum.PiggyBank : UserIconNameEnum.Landmark),
            executeSyncBatch: Effect.fn('MonobankSyncService.executeSyncBatch')(function* (sync: SyncEntityInterface, token: string) {
                const account = yield* accountRepository.findById(sync.accountId);
                if (!isDefined(account) || !isNotEmptyString(account.externalId)) {
                    const now = new Date();

                    return { transactions: [], nextTo: now, nextFrom: now, completed: true };
                }

                const client = new MonobankClient(token);
                const result =
                    sync.mode === SyncModeEnum.FORWARD
                        ? yield* syncTransactionsForward(client, account.externalId, sync.forwardSyncFromAt ?? new Date())
                        : yield* syncTransactionsBackward(client, account.externalId, sync);
                yield* Effect.yieldNow;
                const changedTransactions = yield* processFetchedTransactions(result.transactions, account.id);
                yield* reconcileChangedTransactions(changedTransactions);
                yield* Effect.yieldNow;

                return result;
            }),
            beforeSyncRun: Effect.fn('MonobankSyncService.beforeSyncRun')(function* () {
                mccCategoryLookupMap = yield* loadMccCategoryLookupMap(mccCategoryRepository, settingsRepository);
            }),
            applyProgressUpdate: (sync, result) =>
                sync.mode === SyncModeEnum.BACKWARD && result.completed && isDefined(sync.setupBalance)
                    ? completeBackwardHistory(sync, sync.setupBalance, result)
                    : updateProgressAndReconcile(sync, result),
            isCredentialWideError: error => error instanceof SyncUnauthorizedError
        });

        const rotateIntegrationToken = Effect.fnUntraced(function* (integrationId: number, client: MonobankClient, token: string) {
            const previousToken = (yield* bankIntegrationRepository.findById(integrationId))?.token;
            yield* pollingSyncService.updateIntegrationToken(integrationId, token);
            if (isDefined(previousToken)) {
                yield* Cache.invalidate(loadedClientCache, previousToken);
            }
            yield* syncIntegrationTokenService.fillIntegrationLabel(integrationId, yield* client.getClientName());
        });

        const mapBankAccountsToPreview = (bankAccounts: SyncAccountInterface[]) =>
            isNotEmptyArray(bankAccounts) ? pollingSyncService.mapAccountsToPreview(bankAccounts) : Effect.succeed([]);

        const findRotatedIntegrationId = Effect.fnUntraced(function* (bankAccounts: SyncAccountInterface[]) {
            const linkedIntegrationIds = (yield* accountRepository.findByExternalIds(bankAccounts.map(bankAccount => bankAccount.id)))
                .map(account => account.integrationId)
                .filter(isDefined);

            for (const integrationId of new Set(linkedIntegrationIds)) {
                const integration = yield* bankIntegrationRepository.findById(integrationId);
                if (integration?.provider === provider) {
                    return integration.id;
                }
            }

            return null;
        });

        return {
            ...pollingSyncService,
            fetchAccountsPreview: Effect.fn('MonobankSyncService.fetchAccountsPreview')(function* (token: string) {
                return yield* mapBankAccountsToPreview(yield* fetchBankAccountsAndJars(yield* loadClient(token)));
            }),
            fetchNewConnectionAccountsPreview: Effect.fn('MonobankSyncService.fetchNewConnectionAccountsPreview')(function* (
                token: string
            ) {
                yield* syncIntegrationTokenService.ensureTokenAvailable(provider, token, null);
                const client = yield* loadClient(token);
                const bankAccounts = yield* fetchBankAccountsAndJars(client);
                const rotatedIntegrationId = yield* findRotatedIntegrationId(bankAccounts);
                if (isDefined(rotatedIntegrationId)) {
                    yield* rotateIntegrationToken(rotatedIntegrationId, client, token);

                    return {
                        kind: MonobankConnectionResultEnum.TOKEN_ROTATED,
                        integrationId: rotatedIntegrationId
                    } satisfies MonobankConnectionResultType;
                }

                return {
                    kind: MonobankConnectionResultEnum.PREVIEWS,
                    previews: yield* mapBankAccountsToPreview(bankAccounts)
                } satisfies MonobankConnectionResultType;
            }),
            updateIntegrationToken: Effect.fn('MonobankSyncService.updateIntegrationToken')(function* (
                integrationId: number,
                token: string
            ) {
                yield* syncIntegrationTokenService.ensureTokenAvailable(provider, token, integrationId);
                const client = yield* loadClient(token);
                const bankAccountIds = new Set((yield* fetchBankAccountsAndJars(client)).map(bankAccount => bankAccount.id));
                const groupExternalIds = (yield* accountRepository.findByIntegrationId(integrationId))
                    .map(account => account.externalId)
                    .filter(isNotEmptyString);
                if (isNotEmptyArray(groupExternalIds) && !groupExternalIds.some(externalId => bankAccountIds.has(externalId))) {
                    return yield* new SyncTokenClientMismatchError({
                        provider: SyncProviderEnum.MONOBANK,
                        integrationId,
                        message: 'This Monobank token belongs to a different client'
                    });
                }

                yield* rotateIntegrationToken(integrationId, client, token);
            }),
            setupAccountSyncBatch: Effect.fn('MonobankSyncService.setupAccountSyncBatch')(function* (
                token: string,
                externalIds: string[],
                historyDepth: SyncHistoryDepthEnum = SyncHistoryDepthEnum.FULL
            ) {
                const client = yield* loadClient(token);
                const bankAccounts = yield* fetchBankAccountsAndJars(client);

                for (const externalId of externalIds) {
                    const bankAccount = bankAccounts.find(account => account.id === externalId);
                    if (isDefined(bankAccount)) {
                        const account = yield* pollingSyncService.getOrCreateSyncAccount(bankAccount);
                        yield* createOrUpdateSync(account.id, token, historyDepth, getOwnBalance(bankAccount));
                    }
                }

                const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
                yield* syncIntegrationTokenService.fillIntegrationLabel(integration.id, yield* client.getClientName());
                yield* pollingSyncService.requestSync();
            }),
            fetchSetupBalance: Effect.fn('MonobankSyncService.fetchSetupBalance')(function* (accountId: number) {
                const account = yield* accountRepository.findById(accountId);
                const token = yield* syncIntegrationTokenService.resolveAccountToken(provider, accountId);
                const bankAccounts = yield* fetchBankAccountsAndJars(yield* loadClient(token));
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
            BankIntegrationRepository.layer,
            MccCategoryRepository.layer,
            SettingsRepository.layer,
            AccountBalanceIncrementalService.layer,
            BalanceAdjustmentService.layer,
            SyncBalanceReconciliationService.layer,
            RuleEngineService.layer,
            TransferConsolidationService.layer,
            SyncOperationMetadataService.layer
        ])
    );
}
