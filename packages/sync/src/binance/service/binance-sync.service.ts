import { P2P_ORDER_EXTERNAL_ID_MARKER, consolidationScopeService } from '@budgie/consolidation';
import { AccountRepository, SyncModeEnum, TransactionRepository } from '@budgie/contracts';
import { ImportedTransactionEntryUpdateService, TransactionService, TransferCreationService } from '@budgie/ledger';
import { getUnixTime } from 'date-fns/getUnixTime';
import { subDays } from 'date-fns/subDays';
import { subYears } from 'date-fns/subYears';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { SyncDeferredError } from '../../core/error/sync-deferred.error';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { SyncIntegrationTokenService } from '../../core/service/sync-integration-token.service';
import { makePollingSyncService } from '../../core/util/make-polling-sync-service.util';
import { mapBankTransactionToCreateInput } from '../../core/util/map-bank-transaction-to-create-input.util';
import { BinanceSignedClient } from '../client/binance-signed.client';
import { BINANCE_ACCOUNT_DEFINITION } from '../constant/binance-account-definition.constant';
import { BinanceCredentialsSchema } from '../constant/binance-credentials.schema';
import { BINANCE_RATE_LIMIT_MS } from '../constant/binance-rate-limit-ms.constant';
import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { BINANCE_TRANSFER_LOOKBACK_YEARS } from '../constant/binance-transfer-lookback-years.constant';
import { BinanceTransferInputMapper } from '../mapper/binance-transfer-input.mapper';

import { BinanceAccountService } from './binance-account.service';
import { BinanceAssetCodeService } from './binance-asset-code.service';
import { BinanceSourceQuoteService } from './binance-source-quote.service';
import { BinanceTradeCursorService } from './binance-trade-cursor.service';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncError } from '../../core/interface/sync-error.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { AccountEntityInterface, SyncEntityInterface, TransactionCreateInputInterface } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

export class BinanceSyncService extends Context.Service<BinanceSyncService>()('@budgie/sync/BinanceSyncService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const transactionRepository = yield* TransactionRepository;
        const importedTransactionEntryUpdateService = yield* ImportedTransactionEntryUpdateService;
        const transactionService = yield* TransactionService;
        const transferCreationService = yield* TransferCreationService;
        const binanceAccountService = yield* BinanceAccountService;
        const binanceAssetCodeService = yield* BinanceAssetCodeService;
        const binanceSourceQuoteService = yield* BinanceSourceQuoteService;
        const binanceTradeCursorService = yield* BinanceTradeCursorService;
        const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
        const syncWorkload = yield* SyncWorkload;
        const { provider } = BINANCE_ACCOUNT_DEFINITION;
        const transferChunkSize = 50;
        const sourceInputYieldInterval = 50;
        const forwardOverlapDays = 1;
        const fiatRefreshIntervalMs = 23 * 60 * 60 * 1000;
        const decodeCredentials = Schema.decodeUnknownEffect(Schema.fromJsonString(BinanceCredentialsSchema));
        let runDeadlineAtMs = Number.POSITIVE_INFINITY;
        let runDeferred = false;
        let transfersSyncedThisRun = false;
        let sourcesSyncedThisRun = false;
        let balancesAnchoredThisRun = false;
        let runSignedClient: BinanceSignedClient | null = null;
        let runClientToken: string | null = null;
        let runExchangeAccounts: SyncAccountInterface[] | null = null;
        let fiatSyncedAtMs: number | null = null;
        let providerSourceFailedThisRun = false;

        const resetRunState = (): void => {
            transfersSyncedThisRun = false;
            sourcesSyncedThisRun = false;
            balancesAnchoredThisRun = false;
            runSignedClient = null;
            runClientToken = null;
            runExchangeAccounts = null;
            providerSourceFailedThisRun = false;
        };

        const resolveWindowStart = (sync: SyncEntityInterface): Date => {
            if (sync.mode === SyncModeEnum.BACKWARD) {
                return subYears(sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);
            }

            if (isDefined(sync.forwardSyncedAt)) {
                return subDays(sync.forwardSyncedAt, forwardOverlapDays);
            }

            return subYears(sync.forwardSyncFromAt ?? new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);
        };

        const getRunSignedClient = (token: string): BinanceSignedClient => {
            if (!isDefined(runSignedClient) || runClientToken !== token) {
                runSignedClient = new BinanceSignedClient(token, runDeadlineAtMs);
                runClientToken = token;
                runExchangeAccounts = null;
            }

            return runSignedClient;
        };

        const fetchExchangeAccounts = Effect.fnUntraced(function* (token: string) {
            if (isDefined(runExchangeAccounts) && runClientToken === token) {
                return runExchangeAccounts;
            }

            return yield* getRunSignedClient(token)
                .getAccounts()
                .pipe(
                    Effect.tap(accounts =>
                        Effect.sync(() => {
                            runExchangeAccounts = accounts;
                        })
                    )
                );
        });

        const buildRunAccountResolver = Effect.fnUntraced(function* (token: string) {
            const exchangeAccounts = yield* fetchExchangeAccounts(token);
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

            return yield* binanceAccountService.buildAccountResolver(exchangeAccounts, integration.id);
        });

        const anchorAllBalances = Effect.fnUntraced(function* (token: string) {
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

            yield* binanceAccountService.attachOrphanAccounts(integration.id);
            yield* binanceAccountService.anchorAllBalances(yield* fetchExchangeAccounts(token));
        });

        const enqueueExistingSourceConsolidation = Effect.fnUntraced(function* (
            sourceTransactions: SyncTransactionInterface[],
            existingIdMap: ReadonlyMap<string, number>
        ) {
            const transactionIds = sourceTransactions
                .filter(transaction => transaction.id.includes(P2P_ORDER_EXTERNAL_ID_MARKER))
                .map(transaction => existingIdMap.get(transaction.id))
                .filter(isDefined);
            if (!isNotEmptyArray(transactionIds)) {
                return;
            }

            const consolidationScope = consolidationScopeService.buildFromTransactions(
                yield* transactionRepository.findByIds(transactionIds)
            );
            if (isDefined(consolidationScope)) {
                yield* syncWorkload.enqueueTransferConsolidation(consolidationScope);
            }
        });

        const reconcileSourceAccount = Effect.fnUntraced(function* <E, R>(
            transaction: SyncTransactionInterface,
            resolveAccount: (codecAccountId: string) => Effect.Effect<AccountEntityInterface | null, E, R>,
            existingIdMap: ReadonlyMap<string, number>
        ) {
            const account = yield* resolveAccount(transaction.accountId);
            const transactionId = existingIdMap.get(transaction.id);
            if (!isDefined(account) || !isDefined(transactionId)) {
                return 0;
            }

            const accountChanged = yield* transactionService.moveExternalEntryToAccount(
                transactionId,
                transaction.id,
                account.id,
                transaction.type === SyncTransactionTypeEnum.INCOME
            );
            const quote = yield* binanceSourceQuoteService.resolve(transaction);
            const quoteChanged =
                isDefined(quote) &&
                (yield* importedTransactionEntryUpdateService.updateExternalEntryQuote(transactionId, transaction.id, quote));

            return accountChanged || quoteChanged ? 1 : 0;
        });

        const reconcileSourceAccounts = Effect.fnUntraced(function* (
            transactions: SyncTransactionInterface[],
            token: string,
            existingIdMap: ReadonlyMap<string, number>
        ) {
            const resolveAccount = yield* buildRunAccountResolver(token);
            let reconciledCount = 0;
            for (const transaction of transactions) {
                reconciledCount += yield* reconcileSourceAccount(transaction, resolveAccount, existingIdMap);
            }

            return reconciledCount;
        });

        const createSyncedSources = Effect.fnUntraced(function* (transactions: SyncTransactionInterface[], token: string) {
            const resolveAccount = yield* buildRunAccountResolver(token);
            const inputs: TransactionCreateInputInterface[] = [];
            for (const [index, transaction] of transactions.entries()) {
                if (isPositiveNumber(index) && index % sourceInputYieldInterval === 0) {
                    yield* Effect.yieldNow;
                }
                const account = yield* resolveAccount(transaction.accountId);
                if (isDefined(account)) {
                    inputs.push(
                        yield* binanceSourceQuoteService.applyToInput(
                            mapBankTransactionToCreateInput(transaction, account.id, null, provider),
                            transaction
                        )
                    );
                }
            }

            return isNotEmptyArray(inputs) ? (yield* transactionService.bulkCreate(inputs)).length : 0;
        });

        const createSyncedTransfers = Effect.fnUntraced(function* (transfers: BinanceTransferInterface[], token: string) {
            const inputs = yield* new BinanceTransferInputMapper(yield* buildRunAccountResolver(token)).map(transfers);

            let createdCount = 0;
            for (let index = 0; index < inputs.length; index += transferChunkSize) {
                createdCount += (yield* transferCreationService.createSyncedTransfers(inputs.slice(index, index + transferChunkSize)))
                    .length;
                yield* Effect.yieldNow;
            }

            return createdCount;
        });

        const commitSourceType = Effect.fnUntraced(function* (
            token: string,
            fetchSourceType: Effect.Effect<SyncTransactionInterface[], SyncError, HttpClient.HttpClient>,
            enqueueExistingConsolidation: boolean
        ) {
            const transactions = yield* fetchSourceType.pipe(
                Effect.tapError(() =>
                    Effect.sync(() => {
                        providerSourceFailedThisRun = true;
                    })
                )
            );
            if (!isNotEmptyArray(transactions)) {
                return 0;
            }

            const existingIdMap = yield* transactionService.findIdMapByExternalSource(provider);
            const existingTransactions = transactions.filter(sourceTransaction => existingIdMap.has(sourceTransaction.id));
            const reconciledCount = yield* reconcileSourceAccounts(existingTransactions, token, existingIdMap);
            if (enqueueExistingConsolidation) {
                yield* enqueueExistingSourceConsolidation(existingTransactions, existingIdMap);
            }

            const newTransactions = transactions.filter(sourceTransaction => !existingIdMap.has(sourceTransaction.id));

            return isNotEmptyArray(newTransactions)
                ? reconciledCount + (yield* createSyncedSources(newTransactions, token))
                : reconciledCount;
        });

        const processTransfers = Effect.fnUntraced(function* (sync: SyncEntityInterface, externalAccountId: string, token: string) {
            if (transfersSyncedThisRun) {
                return 0;
            }
            transfersSyncedThisRun = true;

            const transfers = yield* binanceTradeCursorService.fetchTransferBatch(getRunSignedClient(token), sync, externalAccountId, {
                fromUnixTime: getUnixTime(resolveWindowStart(sync)),
                eligibleSoldOffBaseAssets: yield* binanceAssetCodeService.resolveEligibleSoldOffBaseAssets(provider)
            });
            if (!isNotEmptyArray(transfers)) {
                return 0;
            }

            const existingIds = yield* transactionService.findByExternalSource(provider);
            const newTransfers = transfers.filter(transfer => !existingIds.has(transfer.externalId));

            return isNotEmptyArray(newTransfers) ? yield* createSyncedTransfers(newTransfers, token) : 0;
        });

        const processSources = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            if (sourcesSyncedThisRun) {
                return 0;
            }

            const client = getRunSignedClient(token);
            const fromUnixTime = getUnixTime(resolveWindowStart(sync));

            return (
                (yield* commitSourceType(token, client.getC2cTransactions(fromUnixTime), true)) +
                (yield* commitSourceType(token, client.getEarnTransactions(fromUnixTime), false)) +
                (yield* commitSourceType(token, client.getCapitalTransactions(fromUnixTime), false))
            );
        });

        const processFiatSource = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            if (sourcesSyncedThisRun) {
                return 0;
            }

            const isFiatRefreshDue = !isDefined(fiatSyncedAtMs) || Date.now() - fiatSyncedAtMs >= fiatRefreshIntervalMs;
            const createdCount = isFiatRefreshDue
                ? yield* commitSourceType(
                      token,
                      getRunSignedClient(token).getFiatTransactions(getUnixTime(resolveWindowStart(sync))),
                      false
                  ).pipe(
                      Effect.tap(() =>
                          Effect.sync(() => {
                              fiatSyncedAtMs = Date.now();
                          })
                      )
                  )
                : 0;
            yield* Effect.sync(() => {
                sourcesSyncedThisRun = true;
            });

            return createdCount;
        });

        const runSyncPhases = Effect.fn('AppBinanceSyncService.runSyncPhases')(function* (
            sync: SyncEntityInterface,
            externalAccountId: string,
            token: string
        ) {
            let changedCount = 0;
            const addChangedCount = (count: number) => {
                changedCount += count;
            };

            yield* processSources(sync, token).pipe(
                Effect.map(addChangedCount),
                Effect.andThen(Effect.yieldNow),
                Effect.andThen(() => processTransfers(sync, externalAccountId, token)),
                Effect.map(addChangedCount),
                Effect.andThen(Effect.yieldNow),
                Effect.andThen(() => processFiatSource(sync, token)),
                Effect.map(addChangedCount),
                Effect.catchIf(
                    error => error instanceof SyncDeferredError,
                    () =>
                        Effect.sync(() => {
                            runDeferred = true;
                        })
                )
            );

            return changedCount;
        });

        const pollingSyncService = yield* makePollingSyncService({
            ...BINANCE_ACCOUNT_DEFINITION,
            rateLimitMs: BINANCE_RATE_LIMIT_MS,
            backgroundTaskName: BINANCE_SYNC_TASK,
            executeSyncBatch: Effect.fn('AppBinanceSyncService.executeSyncBatch')(function* (sync: SyncEntityInterface) {
                const account = yield* accountRepository.findById(sync.accountId);
                const externalAccountId = account?.externalId ?? null;
                if (!isNotEmptyString(externalAccountId)) {
                    return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
                }

                const token = yield* syncIntegrationTokenService.resolveAccountToken(provider, sync.accountId);
                const changedCount = yield* Effect.ensuring(
                    runSyncPhases(sync, externalAccountId, token),
                    Effect.orDie(Effect.suspend(() => binanceTradeCursorService.persistRunSideEffects(sync, runSignedClient)))
                );
                if (isPositiveNumber(changedCount)) {
                    yield* transactionService.updateAllBalances();
                    yield* syncWorkload.enqueueTransferConsolidation();
                }

                const progressDate = runDeferred ? (sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date()) : new Date();

                return {
                    transactions: [],
                    transactionCount: changedCount,
                    nextTo: progressDate,
                    nextFrom: progressDate,
                    completed: !runDeferred
                };
            }),
            beforeSyncRun: Effect.fn('AppBinanceSyncService.beforeSyncRun')(function* (deadlineAtMs: number) {
                yield* Effect.sync(() => {
                    runDeadlineAtMs = deadlineAtMs;
                    runDeferred = false;
                    resetRunState();
                });
            }),
            beforeProcessRun: (firstSyncToken: string) => {
                if (balancesAnchoredThisRun) {
                    return Effect.void;
                }
                balancesAnchoredThisRun = true;

                return anchorAllBalances(firstSyncToken);
            },
            validateToken: token => decodeCredentials(token),
            afterSyncRun: resetRunState,
            isRunWorkComplete: () => sourcesSyncedThisRun && transfersSyncedThisRun,
            isRunDeferred: () => runDeferred,
            isRetryableError: error =>
                !(
                    error instanceof SyncUnauthorizedError ||
                    error instanceof SyncInvalidResponseError ||
                    error instanceof SyncDeferredError
                ),
            isCredentialWideError: error => error instanceof SyncUnauthorizedError,
            shouldKeepSyncsEnabledAfterError: error => providerSourceFailedThisRun && error instanceof SyncInvalidResponseError
        });

        return {
            ...pollingSyncService,
            fetchAccountsPreview: Effect.fn('AppBinanceSyncService.fetchAccountsPreview')(function* (token: string) {
                const exchangeAccounts = yield* fetchExchangeAccounts(token);
                const supportedIds = new Set(
                    (yield* binanceAccountService.findResolvableAccounts(exchangeAccounts)).map(
                        resolvableAccount => resolvableAccount.exchangeAccount.id
                    )
                );

                return yield* pollingSyncService.mapAccountsToPreview(
                    exchangeAccounts,
                    exchangeAccount => !supportedIds.has(exchangeAccount.id)
                );
            }),
            setupAccountSyncBatch: Effect.fn('AppBinanceSyncService.setupAccountSyncBatch')(function* (
                token: string,
                externalIds: string[]
            ) {
                const resolvableAccounts = yield* binanceAccountService.findResolvableAccounts(
                    (yield* fetchExchangeAccounts(token)).filter(exchangeAccount => externalIds.includes(exchangeAccount.id))
                );
                const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

                for (const resolvableAccount of resolvableAccounts) {
                    const account = yield* binanceAccountService.setupAccount(resolvableAccount, integration.id);
                    yield* pollingSyncService.createOrUpdateSync(account.id, token);
                }

                if (isNotEmptyArray(resolvableAccounts)) {
                    yield* Effect.forkDetach(pollingSyncService.registerBackgroundTask().pipe(Effect.ignoreCause({ log: true })));
                    yield* pollingSyncService.requestSync();
                }

                return resolvableAccounts.length;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BinanceSyncService, BinanceSyncService.make).pipe(
        Layer.provide([
            pollingSyncDependenciesLayer,
            ImportedTransactionEntryUpdateService.layer,
            TransferCreationService.layer,
            BinanceAccountService.layer,
            BinanceAssetCodeService.layer,
            BinanceSourceQuoteService.layer,
            BinanceTradeCursorService.layer
        ])
    );
}
