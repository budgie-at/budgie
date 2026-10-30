import { AccountRepository, SyncModeEnum, SyncRepository } from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { getUnixTime } from 'date-fns/getUnixTime';
import { subHours } from 'date-fns/subHours';
import { subYears } from 'date-fns/subYears';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncDeferredError } from '../../core/error/sync-deferred.error';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { SyncRegionUnavailableError } from '../../core/error/sync-region-unavailable.error';
import { SyncTokenClientMismatchError } from '../../core/error/sync-token-client-mismatch.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { SyncIntegrationTokenService } from '../../core/service/sync-integration-token.service';
import { makePollingSyncAccountSetup } from '../../core/utils/make-polling-sync-account-setup.util';
import { makePollingSyncService } from '../../core/utils/make-polling-sync-service.util';
import { resolveSyncProgressUpdate } from '../../core/utils/resolve-sync-progress-update.util';
import { BinanceSignedClient } from '../client/binance-signed.client';
import { BINANCE_ACCOUNT_DEFINITION } from '../constant/binance-account-definition.constant';
import { BinanceCredentialsSchema } from '../constant/binance-credentials.schema';
import { BinanceRateLimitMs } from '../constant/binance-rate-limit-ms.constant';
import { BinanceHistorySourceEnum } from '../enum/binance-history-source.enum';

import { BinanceAccountService } from './binance-account.service';
import { BinanceAssetCodeService } from './binance-asset-code.service';
import { BinanceHistoryProgressService } from './binance-history-progress.service';
import { BinanceSourceCommitService } from './binance-source-commit.service';
import { BinanceTradeCursorService } from './binance-trade-cursor.service';

import type { SyncError } from '../../core/interface/sync-error.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceRunStateInterface } from '../interface/binance-run-state.interface';
import type { BinanceSourceCommitOptionsInterface } from '../interface/binance-source-commit-options.interface';
import type { BinanceTokenRunStateInterface } from '../interface/binance-token-run-state.interface';
import type { BinanceTransferInterface } from '../interface/binance-transfer.interface';
import type { SyncEntityInterface } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

export class BinanceSyncService extends Context.Service<BinanceSyncService>()('@budgie/sync/BinanceSyncService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const syncRepository = yield* SyncRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const binanceAccountService = yield* BinanceAccountService;
        const binanceAssetCodeService = yield* BinanceAssetCodeService;
        const binanceHistoryProgressService = yield* BinanceHistoryProgressService;
        const binanceSourceCommitService = yield* BinanceSourceCommitService;
        const binanceTradeCursorService = yield* BinanceTradeCursorService;
        const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
        const syncWorkload = yield* SyncWorkload;
        const { provider } = BINANCE_ACCOUNT_DEFINITION;
        const createOrUpdateSync = yield* makePollingSyncAccountSetup(provider);
        const forwardOverlapHours = 24;
        const fiatRefreshIntervalMs = 23 * 60 * 60 * 1000;
        const createOnly = { enqueueExistingConsolidation: false, updateExistingAmounts: false };
        const updateExisting = { enqueueExistingConsolidation: false, updateExistingAmounts: true };
        const consolidateExisting = { enqueueExistingConsolidation: true, updateExistingAmounts: false };
        const newHistorySources = new Set([
            BinanceHistorySourceEnum.LOCKED_EARN,
            BinanceHistorySourceEnum.ETH_STAKING,
            BinanceHistorySourceEnum.DIVIDEND,
            BinanceHistorySourceEnum.DUST
        ]);
        const decodeCredentials = Schema.decodeUnknownEffect(Schema.fromJsonString(BinanceCredentialsSchema));
        const transferLookbackYears = 5;
        const fiatBackfillChunkSeconds = 365 * 24 * 60 * 60;
        const headOverlapSeconds = forwardOverlapHours * 60 * 60;
        const freshRunState = (deadlineAtMs: number, startedAtMs: number): BinanceRunStateInterface => ({
            deadlineAtMs,
            startedAtMs,
            isDeferred: false,
            providerSourceFailed: false,
            tokenRuns: new Map()
        });
        let run = freshRunState(Number.POSITIVE_INFINITY, 0);
        const fiatSyncedAtMsByToken = new Map<string, number>();

        const isRunDeferred = () => run.isDeferred;

        const markRunDeferred = Effect.sync(() => {
            run = { ...run, isDeferred: true };
        });

        const resolveLookbackStart = (sync: SyncEntityInterface): Date =>
            subYears(
                sync.mode === SyncModeEnum.BACKWARD
                    ? (sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date())
                    : (sync.forwardSyncFromAt ?? new Date()),
                transferLookbackYears
            );

        const resolveWindowStart = (sync: SyncEntityInterface): Date =>
            sync.mode !== SyncModeEnum.BACKWARD && isDefined(sync.forwardSyncedAt)
                ? subHours(sync.forwardSyncedAt, forwardOverlapHours)
                : resolveLookbackStart(sync);

        const resolveHeadStartSeconds = (sync: SyncEntityInterface, headAt: number): number =>
            Math.max(getUnixTime(resolveLookbackStart(sync)), Math.floor(headAt / 1000) - headOverlapSeconds);

        const isFiatRefreshDue = (token: string): boolean => {
            const fiatSyncedAtMs = fiatSyncedAtMsByToken.get(token);

            return !isDefined(fiatSyncedAtMs) || run.startedAtMs - fiatSyncedAtMs >= fiatRefreshIntervalMs;
        };

        const getTokenRun = (token: string): BinanceTokenRunStateInterface => {
            const existingTokenRun = run.tokenRuns.get(token);
            if (isDefined(existingTokenRun)) {
                return existingTokenRun;
            }

            const tokenRun: BinanceTokenRunStateInterface = {
                transfersSynced: false,
                sourcesSynced: false,
                balancesAnchored: false,
                signedClient: new BinanceSignedClient(token, run.deadlineAtMs),
                exchangeAccounts: null
            };
            run = { ...run, tokenRuns: new Map(run.tokenRuns).set(token, tokenRun) };

            return tokenRun;
        };

        const patchTokenRun = (token: string, patch: Partial<BinanceTokenRunStateInterface>): void => {
            const tokenRun = getTokenRun(token);
            run = { ...run, tokenRuns: new Map(run.tokenRuns).set(token, { ...tokenRun, ...patch }) };
        };

        const getRunSignedClient = (token: string): BinanceSignedClient => getTokenRun(token).signedClient;

        const deferIfWalkDeferred = (token: string) =>
            Effect.suspend(() => (isDefined(getRunSignedClient(token).getDeferredFrontierMs()) ? markRunDeferred : Effect.void));

        const fetchExchangeAccounts = Effect.fnUntraced(function* (token: string) {
            const cachedExchangeAccounts = getTokenRun(token).exchangeAccounts;
            if (isDefined(cachedExchangeAccounts)) {
                return cachedExchangeAccounts;
            }

            const exchangeAccounts = yield* getRunSignedClient(token).getAccounts();
            patchTokenRun(token, { exchangeAccounts });

            return exchangeAccounts;
        });

        const anchorAllBalances = Effect.fnUntraced(function* (token: string) {
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

            yield* binanceAccountService.attachOrphanAccounts(integration.id);
            yield* binanceAccountService.anchorAllBalances(yield* fetchExchangeAccounts(token), integration.id);
            patchTokenRun(token, { balancesAnchored: true });
        });

        const commitSourceType = Effect.fnUntraced(function* (
            token: string,
            fetchSourceType: Effect.Effect<SyncTransactionInterface[], SyncError, HttpClient.HttpClient>,
            options: BinanceSourceCommitOptionsInterface
        ) {
            const transactions = yield* getRunSignedClient(token)
                .withPartialWalks(fetchSourceType)
                .pipe(
                    Effect.tapError(() =>
                        Effect.sync(() => {
                            run = { ...run, providerSourceFailed: true };
                        })
                    )
                );
            yield* deferIfWalkDeferred(token);

            return isNotEmptyArray(transactions)
                ? yield* binanceSourceCommitService.commitSources(token, yield* fetchExchangeAccounts(token), transactions, options)
                : 0;
        });

        const commitTransfers = Effect.fnUntraced(function* (transfers: BinanceTransferInterface[], token: string) {
            return yield* binanceSourceCommitService.commitTransfers(token, yield* fetchExchangeAccounts(token), transfers);
        });

        const commitCapitalRange = Effect.fnUntraced(function* (
            sync: SyncEntityInterface,
            token: string,
            fromUnixTime: number,
            toUnixTime: number | null
        ) {
            const client = getRunSignedClient(token);
            const pendingFromAt = sync.binanceCapitalPendingFromAt;
            const rangeStartUnixTime =
                !isDefined(toUnixTime) && isDefined(pendingFromAt) ? Math.min(fromUnixTime, getUnixTime(pendingFromAt)) : fromUnixTime;
            const committedCount = yield* commitSourceType(
                token,
                client.getTransactions(BinanceHistorySourceEnum.CAPITAL, rangeStartUnixTime, toUnixTime),
                createOnly
            );
            const removedCount = yield* binanceSourceCommitService.removeByExternalIds(token, client.getRejectedCapitalExternalIds());
            if (!isRunDeferred()) {
                const pendingFromMs = client.getCapitalPendingFromMs();
                yield* syncRepository.update(sync.id, {
                    binanceCapitalPendingFromAt: isDefined(pendingFromMs) ? new Date(pendingFromMs) : null
                });
            }

            return committedCount + removedCount;
        });

        const commitTransferRange = Effect.fnUntraced(function* (
            token: string,
            fetchTransfers: Effect.Effect<BinanceTransferInterface[], SyncError, HttpClient.HttpClient>
        ) {
            const transfers = yield* getRunSignedClient(token).withPartialWalks(fetchTransfers);
            yield* deferIfWalkDeferred(token);

            return yield* commitTransfers(transfers, token);
        });

        const commitFiatRange = Effect.fnUntraced(function* (token: string, fromUnixTime: number, toUnixTime: number | null) {
            const committedCount = yield* commitSourceType(
                token,
                getRunSignedClient(token).getTransactions(BinanceHistorySourceEnum.FIAT, fromUnixTime, toUnixTime),
                updateExisting
            );
            if (!isRunDeferred()) {
                fiatSyncedAtMsByToken.set(token, yield* Clock.currentTimeMillis);
            }

            return committedCount;
        });

        const syncHistorySource = Effect.fnUntraced(function* <E, R>(
            sync: SyncEntityInterface,
            token: string,
            source: BinanceHistorySourceEnum,
            fetchRange: (fromUnixTime: number, toUnixTime: number | null) => Effect.Effect<number, E, R>
        ) {
            if (isRunDeferred()) {
                return 0;
            }

            const isFiat = source === BinanceHistorySourceEnum.FIAT;
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
            const progress = yield* binanceHistoryProgressService.find(integration.id, source);
            const lookbackSeconds = getUnixTime(resolveLookbackStart(sync));
            const isBackfillPending = isDefined(progress)
                ? Math.floor(progress.tailAt / 1000) > lookbackSeconds
                : isFiat || newHistorySources.has(source) || sync.mode === SyncModeEnum.BACKWARD || !isDefined(sync.forwardSyncedAt);

            const client = getRunSignedClient(token);

            if (!isBackfillPending) {
                const isHeadResumable = sync.mode === SyncModeEnum.BACKWARD && isDefined(progress);
                const windowStartSeconds = isHeadResumable
                    ? resolveHeadStartSeconds(sync, progress.headAt)
                    : getUnixTime(resolveWindowStart(sync));

                return isFiat && !isFiatRefreshDue(token) ? 0 : yield* fetchRange(windowStartSeconds, null);
            }

            const chunkSeconds = isFiat ? fiatBackfillChunkSeconds : Number.POSITIVE_INFINITY;
            const startedAtSeconds = Math.floor(run.startedAtMs / 1000);
            let committedCount = 0;
            if (isDefined(progress)) {
                committedCount += yield* fetchRange(resolveHeadStartSeconds(sync, progress.headAt), null);
                if (isRunDeferred() || client.isSourceSkipped(source)) {
                    return committedCount;
                }
                yield* binanceHistoryProgressService.save(integration.id, source, { ...progress, headAt: run.startedAtMs });
            }

            let tailAt = progress?.tailAt ?? Number.POSITIVE_INFINITY;
            let chunkEndSeconds = isDefined(progress) ? Math.ceil(progress.tailAt / 1000) : null;
            let chunkStartSeconds = Number.POSITIVE_INFINITY;
            while (chunkStartSeconds > lookbackSeconds && !isRunDeferred()) {
                chunkStartSeconds = Math.max(lookbackSeconds, (chunkEndSeconds ?? startedAtSeconds) - chunkSeconds);
                committedCount += yield* fetchRange(chunkStartSeconds, chunkEndSeconds);
                if (client.isSourceSkipped(source)) {
                    yield* binanceHistoryProgressService.save(integration.id, source, {
                        headAt: run.startedAtMs,
                        tailAt: Math.min(tailAt, run.startedAtMs)
                    });

                    return committedCount;
                }
                const reachedAt = isRunDeferred() ? client.getDeferredFrontierMs() : chunkStartSeconds * 1000;
                tailAt = Math.min(tailAt, reachedAt ?? tailAt);
                yield* binanceHistoryProgressService.save(integration.id, source, { headAt: run.startedAtMs, tailAt });
                chunkEndSeconds = chunkStartSeconds;
            }

            return committedCount;
        });

        const processTrades = Effect.fnUntraced(function* (sync: SyncEntityInterface, externalAccountId: string, token: string) {
            if (isRunDeferred() || getTokenRun(token).transfersSynced) {
                return 0;
            }

            const client = getRunSignedClient(token);
            client.noteTouchedAssets(yield* binanceSourceCommitService.findAssetCodes(token));
            const transfers = yield* binanceTradeCursorService.fetchTransferBatch(client, sync, externalAccountId, {
                fromUnixTime: getUnixTime(resolveWindowStart(sync)),
                eligibleSoldOffBaseAssets: yield* binanceAssetCodeService.resolveEligibleSoldOffBaseAssets(provider)
            });
            const createdCount = yield* commitTransfers(transfers, token);
            yield* binanceTradeCursorService.persistTradeCursors(sync, client);
            patchTokenRun(token, { transfersSynced: true });

            return createdCount;
        });

        const processSources = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            if (getTokenRun(token).sourcesSynced) {
                return 0;
            }

            const client = getRunSignedClient(token);
            const transactionSources = [
                [BinanceHistorySourceEnum.C2C, consolidateExisting],
                [BinanceHistorySourceEnum.EARN, updateExisting],
                [BinanceHistorySourceEnum.LOCKED_EARN, updateExisting],
                [BinanceHistorySourceEnum.ETH_STAKING, updateExisting],
                [BinanceHistorySourceEnum.DIVIDEND, createOnly]
            ] as const;
            const historySources = [
                ...transactionSources.map(([source, options]) => ({
                    source,
                    run: (fromUnixTime: number, toUnixTime: number | null) =>
                        commitSourceType(token, client.getTransactions(source, fromUnixTime, toUnixTime), options)
                })),
                {
                    source: BinanceHistorySourceEnum.CAPITAL,
                    run: (fromUnixTime: number, toUnixTime: number | null) => commitCapitalRange(sync, token, fromUnixTime, toUnixTime)
                },
                {
                    source: BinanceHistorySourceEnum.CONVERT,
                    run: (fromUnixTime: number, toUnixTime: number | null) =>
                        commitTransferRange(token, client.getConvertTransfers(fromUnixTime, toUnixTime))
                },
                {
                    source: BinanceHistorySourceEnum.DUST,
                    run: (fromUnixTime: number, toUnixTime: number | null) =>
                        commitTransferRange(token, client.getDustTransfers(fromUnixTime, toUnixTime))
                }
            ];
            let committedCount = 0;
            for (const { source, run: runSource } of historySources) {
                committedCount += yield* client.isolateSourceFailure(syncHistorySource(sync, token, source, runSource));
            }

            return committedCount;
        });

        const processFiatSource = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            if (isRunDeferred() || getTokenRun(token).sourcesSynced) {
                return 0;
            }

            const changedCount = yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.FIAT, (fromUnixTime, toUnixTime) =>
                commitFiatRange(token, fromUnixTime, toUnixTime)
            );
            if (!isRunDeferred() && !getRunSignedClient(token).hasSourceFailure()) {
                patchTokenRun(token, { sourcesSynced: true });
            }

            return changedCount;
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
                Effect.andThen(() => processFiatSource(sync, token)),
                Effect.map(addChangedCount),
                Effect.andThen(Effect.yieldNow),
                Effect.andThen(() => processTrades(sync, externalAccountId, token)),
                Effect.map(addChangedCount),
                Effect.catchTag('SyncDeferredError', () => markRunDeferred)
            );

            return changedCount;
        });

        const completeIntegrationBackwardSyncs = Effect.fnUntraced(function* (token: string) {
            const { sourcesSynced, transfersSynced } = getTokenRun(token);
            if (isRunDeferred() || !sourcesSynced || !transfersSynced) {
                return;
            }

            const now = new Date();
            for (const backwardSync of yield* syncRepository.getPendingBackwardSync(provider)) {
                if ((yield* syncIntegrationTokenService.resolveAccountToken(provider, backwardSync.accountId)) === token) {
                    yield* syncRepository.update(backwardSync.id, {
                        ...resolveSyncProgressUpdate(backwardSync, { transactions: [], nextTo: now, nextFrom: now, completed: true }),
                        forwardSyncedAt: now
                    });
                }
            }
        });

        const assertSameClient = Effect.fnUntraced(function* (integrationId: number, clientId: string) {
            const storedClientId = yield* syncIntegrationTokenService.findIntegrationClientId(integrationId);
            if (isNotEmptyString(storedClientId) && storedClientId !== clientId) {
                return yield* new SyncTokenClientMismatchError({
                    provider: SyncProviderEnum.BINANCE,
                    integrationId,
                    message: 'This Binance API key belongs to a different account'
                });
            }
        });

        const resolveSetupIntegration = Effect.fnUntraced(function* (token: string, clientId: string) {
            const sameClientIntegration = yield* syncIntegrationTokenService.findIntegrationByClientId(provider, clientId);
            if (isDefined(sameClientIntegration) && sameClientIntegration.token !== token) {
                yield* syncIntegrationTokenService.updateIntegrationToken(sameClientIntegration.id, token);

                return sameClientIntegration;
            }

            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
            yield* syncIntegrationTokenService.fillIntegrationClientId(integration.id, clientId);

            return integration;
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

                const changedCount = isRunDeferred()
                    ? 0
                    : yield* Effect.ensuring(
                          runSyncPhases(sync, externalAccountId, token),
                          Effect.orDie(Effect.suspend(() => binanceTradeCursorService.persistRunWarning(sync, getRunSignedClient(token))))
                      );
                yield* completeIntegrationBackwardSyncs(token);
                if (isPositiveNumber(changedCount)) {
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                    yield* syncWorkload.enqueueTransferConsolidation();
                }
                yield* getRunSignedClient(token).failWithSourceFailure();

                const progressDate = isRunDeferred() ? (sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date()) : new Date();

                return {
                    transactions: [],
                    transactionCount: changedCount,
                    nextTo: progressDate,
                    nextFrom: progressDate,
                    completed: !isRunDeferred()
                };
            }),
            beforeProcessRun: (tokens: readonly string[]) =>
                Effect.forEach(
                    tokens,
                    token =>
                        isRunDeferred() || getTokenRun(token).balancesAnchored
                            ? Effect.void
                            : anchorAllBalances(token).pipe(Effect.catchTag('SyncDeferredError', () => markRunDeferred)),
                    { discard: true }
                ),
            beforeSyncRun: (deadlineAtMs: number) =>
                Effect.map(Clock.currentTimeMillis, startedAtMs => {
                    run = freshRunState(deadlineAtMs, startedAtMs);
                }),
            afterSyncRun: () => {
                run = freshRunState(Number.POSITIVE_INFINITY, 0);
            },
            isRunWorkComplete: () =>
                run.tokenRuns.size > 0 && [...run.tokenRuns.values()].every(tokenRun => tokenRun.sourcesSynced && tokenRun.transfersSynced),
            isRunDeferred,
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
                const previewClient = new BinanceSignedClient(token);
                yield* previewClient.assertReadOnlyKey();

                const exchangeAccounts = yield* previewClient.getAccounts();
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
            updateAccountToken: Effect.fn('BinanceSyncService.updateAccountToken')(function* (accountId: number, token: string) {
                yield* decodeCredentials(token);
                const client = new BinanceSignedClient(token);
                yield* client.assertReadOnlyKey();
                const clientId = yield* client.getAccountUid();
                const currentIntegrationId = (yield* accountRepository.findById(accountId))?.integrationId;
                if (isDefined(currentIntegrationId)) {
                    yield* assertSameClient(currentIntegrationId, clientId);
                }

                yield* pollingSyncService.updateAccountToken(accountId, token);
                const rotatedIntegrationId = (yield* accountRepository.findById(accountId))?.integrationId;
                if (isDefined(rotatedIntegrationId)) {
                    yield* syncIntegrationTokenService.fillIntegrationClientId(rotatedIntegrationId, clientId);
                }
            }),
            setupAccountSyncBatch: Effect.fn('BinanceSyncService.setupAccountSyncBatch')(function* (token: string, externalIds: string[]) {
                const client = new BinanceSignedClient(token);
                const resolvableAccounts = yield* binanceAccountService.findResolvableAccounts(
                    (yield* client.getAccounts()).filter(exchangeAccount => externalIds.includes(exchangeAccount.id))
                );
                const integration = yield* resolveSetupIntegration(token, yield* client.getAccountUid());

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
            BinanceAccountService.layer,
            BinanceAssetCodeService.layer,
            BinanceHistoryProgressService.layer,
            BinanceSourceCommitService.layer,
            BinanceTradeCursorService.layer
        ])
    );
}
