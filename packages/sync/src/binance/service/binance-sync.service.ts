import { P2P_ORDER_EXTERNAL_ID_MARKER, buildConsolidationScopeFromTransactions } from '@budgie/consolidation';
import { AccountRepository, SyncModeEnum, SyncRepository, TransactionRepository } from '@budgie/contracts';
import {
    AccountBalanceIncrementalService,
    ImportedTransactionEntryUpdateService,
    TransactionService,
    TransferCreationService
} from '@budgie/ledger';
import { getUnixTime } from 'date-fns/getUnixTime';
import { subHours } from 'date-fns/subHours';
import { subYears } from 'date-fns/subYears';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { SyncDeferredError } from '../../core/error/sync-deferred.error';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { SyncRegionUnavailableError } from '../../core/error/sync-region-unavailable.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { SyncIntegrationTokenService } from '../../core/service/sync-integration-token.service';
import { makePollingSyncAccountSetup } from '../../core/utils/make-polling-sync-account-setup.util';
import { makePollingSyncService } from '../../core/utils/make-polling-sync-service.util';
import { mapBankTransactionToCreateInput } from '../../core/utils/map-bank-transaction-to-create-input.util';
import { BinanceSignedClient } from '../client/binance-signed.client';
import { BINANCE_ACCOUNT_DEFINITION } from '../constant/binance-account-definition.constant';
import { BinanceCredentialsSchema } from '../constant/binance-credentials.schema';
import { BinanceRateLimitMs } from '../constant/binance-rate-limit-ms.constant';
import { mapBinanceTransfersToInputs } from '../mapper/binance-transfer-input.mapper';

import { BinanceAccountService } from './binance-account.service';
import { BinanceAssetCodeService } from './binance-asset-code.service';
import { BinanceSourceQuoteService } from './binance-source-quote.service';
import { BinanceTradeCursorService } from './binance-trade-cursor.service';

import type { SyncError } from '../../core/interface/sync-error.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceRunStateInterface } from '../interface/binance-run-state.interface';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { AccountEntityInterface, SyncEntityInterface, TransactionCreateInputInterface } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

export class BinanceSyncService extends Context.Service<BinanceSyncService>()('@budgie/sync/BinanceSyncService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const syncRepository = yield* SyncRepository;
        const transactionRepository = yield* TransactionRepository;
        const importedTransactionEntryUpdateService = yield* ImportedTransactionEntryUpdateService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transactionService = yield* TransactionService;
        const transferCreationService = yield* TransferCreationService;
        const binanceAccountService = yield* BinanceAccountService;
        const binanceAssetCodeService = yield* BinanceAssetCodeService;
        const binanceSourceQuoteService = yield* BinanceSourceQuoteService;
        const binanceTradeCursorService = yield* BinanceTradeCursorService;
        const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
        const syncWorkload = yield* SyncWorkload;
        const { provider } = BINANCE_ACCOUNT_DEFINITION;
        const createOrUpdateSync = yield* makePollingSyncAccountSetup(provider);
        const transferChunkSize = 50;
        const sourceInputYieldInterval = 50;
        const forwardOverlapHours = 24;
        const fiatRefreshIntervalMs = 23 * 60 * 60 * 1000;
        const decodeCredentials = Schema.decodeUnknownEffect(Schema.fromJsonString(BinanceCredentialsSchema));
        const transferLookbackYears = 5;
        const freshRunState = (deadlineAtMs: number): BinanceRunStateInterface => ({
            deadlineAtMs,
            isDeferred: false,
            transfersSynced: false,
            sourcesSynced: false,
            balancesAnchored: false,
            providerSourceFailed: false,
            signedClient: null,
            clientToken: null,
            exchangeAccounts: null
        });
        let run = freshRunState(Number.POSITIVE_INFINITY);
        let fiatSyncedAtMs: number | null = null;

        const markRunDeferred = Effect.sync(() => {
            run = { ...run, isDeferred: true };
        });

        const resolveWindowStart = (sync: SyncEntityInterface): Date => {
            if (sync.mode === SyncModeEnum.BACKWARD) {
                return subYears(sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date(), transferLookbackYears);
            }

            if (isDefined(sync.forwardSyncedAt)) {
                return subHours(sync.forwardSyncedAt, forwardOverlapHours);
            }

            return subYears(sync.forwardSyncFromAt ?? new Date(), transferLookbackYears);
        };

        const resolveCapitalWindowStart = (sync: SyncEntityInterface): Date => {
            const windowStart = resolveWindowStart(sync);

            return isDefined(sync.binanceCapitalPendingFromAt) && sync.binanceCapitalPendingFromAt < windowStart
                ? sync.binanceCapitalPendingFromAt
                : windowStart;
        };

        const getRunSignedClient = (token: string): BinanceSignedClient => {
            if (isDefined(run.signedClient) && run.clientToken === token) {
                return run.signedClient;
            }

            const signedClient = new BinanceSignedClient(token, run.deadlineAtMs);
            run = { ...run, signedClient, clientToken: token, exchangeAccounts: null };

            return signedClient;
        };

        const fetchExchangeAccounts = Effect.fnUntraced(function* (token: string) {
            if (isDefined(run.exchangeAccounts) && run.clientToken === token) {
                return run.exchangeAccounts;
            }

            const exchangeAccounts = yield* getRunSignedClient(token).getAccounts();
            run = { ...run, exchangeAccounts };

            return exchangeAccounts;
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

            const consolidationScope = buildConsolidationScopeFromTransactions(yield* transactionRepository.findByIds(transactionIds));
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
            const inputs = yield* mapBinanceTransfersToInputs(transfers, yield* buildRunAccountResolver(token));

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
                        run = { ...run, providerSourceFailed: true };
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

        const removeRejectedCapitalTransactions = Effect.fnUntraced(function* (client: BinanceSignedClient) {
            const rejectedExternalIds = client.getRejectedCapitalExternalIds();
            if (rejectedExternalIds.size === 0) {
                return 0;
            }

            const existingIdMap = yield* transactionService.findIdMapByExternalSource(provider);
            let removedCount = 0;
            for (const externalId of rejectedExternalIds) {
                const transactionId = existingIdMap.get(externalId);
                if (isDefined(transactionId)) {
                    yield* transactionService.deleteById(transactionId);
                    removedCount += 1;
                }
            }

            return removedCount;
        });

        const commitCapitalSource = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            const client = getRunSignedClient(token);
            const committedCount = yield* commitSourceType(
                token,
                client.getCapitalTransactions(getUnixTime(resolveCapitalWindowStart(sync))),
                false
            );
            const removedCount = yield* removeRejectedCapitalTransactions(client);
            const pendingFromMs = client.getCapitalPendingFromMs();
            yield* syncRepository.update(sync.id, {
                binanceCapitalPendingFromAt: isDefined(pendingFromMs) ? new Date(pendingFromMs) : null
            });

            return committedCount + removedCount;
        });

        const processTransfers = Effect.fnUntraced(function* (sync: SyncEntityInterface, externalAccountId: string, token: string) {
            if (run.transfersSynced) {
                return 0;
            }

            const client = getRunSignedClient(token);
            const transfers = yield* binanceTradeCursorService.fetchTransferBatch(client, sync, externalAccountId, {
                fromUnixTime: getUnixTime(resolveWindowStart(sync)),
                eligibleSoldOffBaseAssets: yield* binanceAssetCodeService.resolveEligibleSoldOffBaseAssets(provider)
            });
            const existingIds = yield* transactionService.findByExternalSource(provider);
            const newTransfers = transfers.filter(transfer => !existingIds.has(transfer.externalId));
            const createdCount = isNotEmptyArray(newTransfers) ? yield* createSyncedTransfers(newTransfers, token) : 0;
            yield* binanceTradeCursorService.persistTradeCursors(sync, client);
            run = { ...run, transfersSynced: true };

            return createdCount;
        });

        const processSources = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            if (run.sourcesSynced) {
                return 0;
            }

            const client = getRunSignedClient(token);
            const fromUnixTime = getUnixTime(resolveWindowStart(sync));

            return (
                (yield* commitSourceType(token, client.getC2cTransactions(fromUnixTime), true)) +
                (yield* commitSourceType(token, client.getEarnTransactions(fromUnixTime), false)) +
                (yield* commitCapitalSource(sync, token))
            );
        });

        const processFiatSource = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            if (run.sourcesSynced) {
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
                run = { ...run, sourcesSynced: true };
            });

            return createdCount;
        });

        const runSyncPhases = Effect.fn('BinanceSyncService.runSyncPhases')(function* (
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
                Effect.catchTag('SyncDeferredError', () => markRunDeferred)
            );

            return changedCount;
        });

        const pollingSyncService = yield* makePollingSyncService({
            ...BINANCE_ACCOUNT_DEFINITION,
            rateLimitMs: yield* BinanceRateLimitMs,
            executeSyncBatch: Effect.fn('BinanceSyncService.executeSyncBatch')(function* (sync: SyncEntityInterface, token: string) {
                const account = yield* accountRepository.findById(sync.accountId);
                const externalAccountId = account?.externalId ?? null;
                if (!isNotEmptyString(externalAccountId)) {
                    return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
                }

                const changedCount = yield* Effect.ensuring(
                    runSyncPhases(sync, externalAccountId, token),
                    Effect.orDie(Effect.suspend(() => binanceTradeCursorService.persistRunWarning(sync, run.signedClient)))
                );
                if (isPositiveNumber(changedCount)) {
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                    yield* syncWorkload.enqueueTransferConsolidation();
                }

                const progressDate = run.isDeferred ? (sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date()) : new Date();

                return {
                    transactions: [],
                    transactionCount: changedCount,
                    nextTo: progressDate,
                    nextFrom: progressDate,
                    completed: !run.isDeferred
                };
            }),
            beforeSyncRun: (deadlineAtMs: number) =>
                Effect.sync(() => {
                    run = freshRunState(deadlineAtMs);
                }),
            beforeProcessRun: (firstSyncToken: string) =>
                run.balancesAnchored
                    ? Effect.void
                    : Effect.andThen(
                          anchorAllBalances(firstSyncToken),
                          Effect.sync(() => {
                              run = { ...run, balancesAnchored: true };
                          })
                      ).pipe(Effect.catchTag('SyncDeferredError', () => markRunDeferred)),
            validateToken: token => decodeCredentials(token),
            afterSyncRun: () => {
                run = freshRunState(Number.POSITIVE_INFINITY);
            },
            isRunWorkComplete: () => run.sourcesSynced && run.transfersSynced,
            isRunDeferred: () => run.isDeferred,
            isRetryableError: error =>
                !(
                    error instanceof SyncUnauthorizedError ||
                    error instanceof SyncInvalidResponseError ||
                    error instanceof SyncRegionUnavailableError ||
                    error instanceof SyncDeferredError
                ),
            isCredentialWideError: error => error instanceof SyncUnauthorizedError,
            shouldKeepSyncsEnabledAfterError: error =>
                error instanceof SyncRegionUnavailableError || (run.providerSourceFailed && error instanceof SyncInvalidResponseError)
        });

        return {
            ...pollingSyncService,
            fetchAccountsPreview: Effect.fn('BinanceSyncService.fetchAccountsPreview')(function* (token: string) {
                const exchangeAccounts = yield* new BinanceSignedClient(token).getAccounts();
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
            setupAccountSyncBatch: Effect.fn('BinanceSyncService.setupAccountSyncBatch')(function* (token: string, externalIds: string[]) {
                const resolvableAccounts = yield* binanceAccountService.findResolvableAccounts(
                    (yield* new BinanceSignedClient(token).getAccounts()).filter(exchangeAccount =>
                        externalIds.includes(exchangeAccount.id)
                    )
                );
                const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

                for (const resolvableAccount of resolvableAccounts) {
                    const account = yield* binanceAccountService.setupAccount(resolvableAccount, integration.id);
                    yield* createOrUpdateSync(account.id, token);
                }

                if (isNotEmptyArray(resolvableAccounts)) {
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
            AccountBalanceIncrementalService.layer,
            ImportedTransactionEntryUpdateService.layer,
            TransferCreationService.layer,
            BinanceAccountService.layer,
            BinanceAssetCodeService.layer,
            BinanceSourceQuoteService.layer,
            BinanceTradeCursorService.layer
        ])
    );
}
