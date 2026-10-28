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
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
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
import { mapBankTransactionToCreateInput } from '../../core/utils/map-bank-transaction-to-create-input.util';
import { BinanceSignedClient } from '../client/binance-signed.client';
import { BINANCE_ACCOUNT_DEFINITION } from '../constant/binance-account-definition.constant';
import { BinanceCredentialsSchema } from '../constant/binance-credentials.schema';
import { BinanceRateLimitMs } from '../constant/binance-rate-limit-ms.constant';
import { BinanceHistorySourceEnum } from '../enum/binance-history-source.enum';
import { mapBinanceTransfersToInputs } from '../mapper/binance-transfer-input.mapper';

import { BinanceAccountService } from './binance-account.service';
import { BinanceAssetCodeService } from './binance-asset-code.service';
import { BinanceHistoryProgressService } from './binance-history-progress.service';
import { BinanceSourceQuoteService } from './binance-source-quote.service';
import { BinanceTradeCursorService } from './binance-trade-cursor.service';

import type { SyncError } from '../../core/interface/sync-error.type';
import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { BinanceRunStateInterface } from '../interface/binance-run-state.interface';
import type { BinanceTokenRunStateInterface } from '../interface/binance-token-run-state.interface';
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
        const binanceHistoryProgressService = yield* BinanceHistoryProgressService;
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
                signedClient: new BinanceSignedClient(token, run.deadlineAtMs, isFiatRefreshDue(token)),
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

        const buildRunAccountResolver = Effect.fnUntraced(function* (token: string) {
            const exchangeAccounts = yield* fetchExchangeAccounts(token);
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

            return yield* binanceAccountService.buildAccountResolver(exchangeAccounts, integration.id);
        });

        const anchorAllBalances = Effect.fnUntraced(function* (token: string) {
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

            yield* binanceAccountService.attachOrphanAccounts(integration.id);
            yield* binanceAccountService.anchorAllBalances(yield* fetchExchangeAccounts(token), integration.id);
            patchTokenRun(token, { balancesAnchored: true });
        });

        const findIntegrationAccountIds = Effect.fnUntraced(function* (token: string) {
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);

            return (yield* accountRepository.findByExternalSource(provider))
                .filter(account => account.integrationId === integration.id)
                .map(account => account.id);
        });

        const findIntegrationIdMap = Effect.fnUntraced(function* (token: string) {
            return yield* transactionService.findIdMapByExternalSource(provider, yield* findIntegrationAccountIds(token));
        });

        const findDeletedExternalIds = Effect.fnUntraced(function* (token: string) {
            return new Set(
                yield* transactionRepository.findDeletedExternalIdsByExternalSource(provider, yield* findIntegrationAccountIds(token))
            );
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

        const buildSourceInputs = Effect.fnUntraced(function* (transactions: SyncTransactionInterface[], token: string) {
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

            return inputs;
        });

        const createSyncedSources = Effect.fnUntraced(function* (transactions: SyncTransactionInterface[], token: string) {
            const inputs = yield* buildSourceInputs(transactions, token);

            return isNotEmptyArray(inputs) ? (yield* transactionService.bulkCreate(inputs)).length : 0;
        });

        const updateSyncedSources = Effect.fnUntraced(function* (transactions: SyncTransactionInterface[], token: string) {
            const inputs = yield* buildSourceInputs(transactions, token);
            if (isNotEmptyArray(inputs)) {
                yield* transactionService.bulkUpdateImported(inputs);
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            }
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
            enqueueExistingConsolidation: boolean,
            updateExistingAmounts = false
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
            if (!isNotEmptyArray(transactions)) {
                return 0;
            }

            const existingIdMap = yield* findIntegrationIdMap(token);
            const existingTransactions = transactions.filter(sourceTransaction => existingIdMap.has(sourceTransaction.id));
            const reconciledCount = yield* reconcileSourceAccounts(existingTransactions, token, existingIdMap);
            if (updateExistingAmounts && isNotEmptyArray(existingTransactions)) {
                yield* updateSyncedSources(existingTransactions, token);
            }
            if (enqueueExistingConsolidation) {
                yield* enqueueExistingSourceConsolidation(existingTransactions, existingIdMap);
            }

            const deletedExternalIds = yield* findDeletedExternalIds(token);
            const newTransactions = transactions.filter(
                sourceTransaction => !existingIdMap.has(sourceTransaction.id) && !deletedExternalIds.has(sourceTransaction.id)
            );

            return isNotEmptyArray(newTransactions)
                ? reconciledCount + (yield* createSyncedSources(newTransactions, token))
                : reconciledCount;
        });

        const removeRejectedCapitalTransactions = Effect.fnUntraced(function* (token: string, client: BinanceSignedClient) {
            const rejectedExternalIds = client.getRejectedCapitalExternalIds();
            if (rejectedExternalIds.size === 0) {
                return 0;
            }

            const existingIdMap = yield* findIntegrationIdMap(token);
            const removableTransactionIds = [...rejectedExternalIds].map(externalId => existingIdMap.get(externalId)).filter(isDefined);
            for (const transactionId of removableTransactionIds) {
                const consolidationParentId = (yield* transactionRepository.getByIdRaw(transactionId))?.consolidationParentTransactionId;
                if (isDefined(consolidationParentId)) {
                    yield* transactionService.unconsolidateById(consolidationParentId);
                }
                yield* transactionService.deleteById(transactionId);
            }

            return removableTransactionIds.length;
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
            const committedCount = yield* commitSourceType(token, client.getCapitalTransactions(rangeStartUnixTime, toUnixTime), false);
            const removedCount = yield* removeRejectedCapitalTransactions(token, client);
            if (!run.isDeferred) {
                const pendingFromMs = client.getCapitalPendingFromMs();
                yield* syncRepository.update(sync.id, {
                    binanceCapitalPendingFromAt: isDefined(pendingFromMs) ? new Date(pendingFromMs) : null
                });
            }

            return committedCount + removedCount;
        });

        const commitTransfers = Effect.fnUntraced(function* (transfers: BinanceTransferInterface[], token: string) {
            const existingIdMap = yield* findIntegrationIdMap(token);
            const deletedExternalIds = yield* findDeletedExternalIds(token);
            const newTransfers = transfers.filter(
                transfer =>
                    !existingIdMap.has(transfer.externalId) &&
                    !deletedExternalIds.has(transfer.externalId) &&
                    !(
                        isDefined(transfer.legacyExternalId) &&
                        (existingIdMap.has(transfer.legacyExternalId) || deletedExternalIds.has(transfer.legacyExternalId))
                    )
            );

            return isNotEmptyArray(newTransfers) ? yield* createSyncedTransfers(newTransfers, token) : 0;
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
                getRunSignedClient(token).getFiatTransactions(fromUnixTime, toUnixTime),
                false,
                true
            );
            if (!run.isDeferred) {
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
            if (run.isDeferred) {
                return 0;
            }

            const isFiat = source === BinanceHistorySourceEnum.FIAT;
            const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
            const progress = yield* binanceHistoryProgressService.find(integration.id, source);
            const lookbackSeconds = getUnixTime(resolveLookbackStart(sync));
            const isBackfillPending = isDefined(progress)
                ? Math.floor(progress.tailAt / 1000) > lookbackSeconds
                : isFiat || sync.mode === SyncModeEnum.BACKWARD || !isDefined(sync.forwardSyncedAt);

            if (!isBackfillPending) {
                return isFiat && !isFiatRefreshDue(token) ? 0 : yield* fetchRange(getUnixTime(resolveWindowStart(sync)), null);
            }

            const chunkSeconds = isFiat ? fiatBackfillChunkSeconds : Number.POSITIVE_INFINITY;
            const startedAtSeconds = Math.floor(run.startedAtMs / 1000);
            let committedCount = 0;
            if (isDefined(progress)) {
                committedCount += yield* fetchRange(
                    Math.max(lookbackSeconds, Math.floor(progress.headAt / 1000) - headOverlapSeconds),
                    null
                );
                if (run.isDeferred) {
                    return committedCount;
                }
                yield* binanceHistoryProgressService.save(integration.id, source, { ...progress, headAt: run.startedAtMs });
            }

            let tailAt = progress?.tailAt ?? Number.POSITIVE_INFINITY;
            let chunkEndSeconds = isDefined(progress) ? Math.ceil(progress.tailAt / 1000) : null;
            let chunkStartSeconds = Number.POSITIVE_INFINITY;
            while (chunkStartSeconds > lookbackSeconds && !run.isDeferred) {
                chunkStartSeconds = Math.max(lookbackSeconds, (chunkEndSeconds ?? startedAtSeconds) - chunkSeconds);
                committedCount += yield* fetchRange(chunkStartSeconds, chunkEndSeconds);
                const reachedAt = run.isDeferred ? getRunSignedClient(token).getDeferredFrontierMs() : chunkStartSeconds * 1000;
                tailAt = Math.min(tailAt, reachedAt ?? tailAt);
                yield* binanceHistoryProgressService.save(integration.id, source, { headAt: run.startedAtMs, tailAt });
                chunkEndSeconds = chunkStartSeconds;
            }

            return committedCount;
        });

        const processTransfers = Effect.fnUntraced(function* (sync: SyncEntityInterface, externalAccountId: string, token: string) {
            if (getTokenRun(token).transfersSynced) {
                return 0;
            }

            const convertCount =
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.CONVERT, (fromUnixTime, toUnixTime) =>
                    commitTransferRange(token, getRunSignedClient(token).getConvertTransfers(fromUnixTime, toUnixTime))
                )) +
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.DUST, (fromUnixTime, toUnixTime) =>
                    commitTransferRange(token, getRunSignedClient(token).getDustTransfers(fromUnixTime, toUnixTime))
                ));
            if (run.isDeferred) {
                return convertCount;
            }

            const client = getRunSignedClient(token);
            const transfers = yield* binanceTradeCursorService.fetchTransferBatch(client, sync, externalAccountId, {
                fromUnixTime: getUnixTime(resolveWindowStart(sync)),
                eligibleSoldOffBaseAssets: yield* binanceAssetCodeService.resolveEligibleSoldOffBaseAssets(provider)
            });
            const createdCount = yield* commitTransfers(transfers, token);
            yield* binanceTradeCursorService.persistTradeCursors(sync, client);
            patchTokenRun(token, { transfersSynced: true });

            return convertCount + createdCount;
        });

        const processSources = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            if (getTokenRun(token).sourcesSynced) {
                return 0;
            }

            const client = getRunSignedClient(token);

            return (
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.C2C, (fromUnixTime, toUnixTime) =>
                    commitSourceType(token, client.getC2cTransactions(fromUnixTime, toUnixTime), true)
                )) +
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.EARN, (fromUnixTime, toUnixTime) =>
                    commitSourceType(token, client.getEarnTransactions(fromUnixTime, toUnixTime), false, true)
                )) +
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.LOCKED_EARN, (fromUnixTime, toUnixTime) =>
                    commitSourceType(token, client.getLockedEarnTransactions(fromUnixTime, toUnixTime), false, true)
                )) +
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.ETH_STAKING, (fromUnixTime, toUnixTime) =>
                    commitSourceType(token, client.getEthStakingTransactions(fromUnixTime, toUnixTime), false, true)
                )) +
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.SOL_STAKING, (fromUnixTime, toUnixTime) =>
                    commitSourceType(token, client.getSolStakingTransactions(fromUnixTime, toUnixTime), false, true)
                )) +
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.DIVIDEND, (fromUnixTime, toUnixTime) =>
                    commitSourceType(token, client.getDividendTransactions(fromUnixTime, toUnixTime), false)
                )) +
                (yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.CAPITAL, (fromUnixTime, toUnixTime) =>
                    commitCapitalRange(sync, token, fromUnixTime, toUnixTime)
                ))
            );
        });

        const processFiatSource = Effect.fnUntraced(function* (sync: SyncEntityInterface, token: string) {
            if (run.isDeferred || getTokenRun(token).sourcesSynced) {
                return 0;
            }

            const changedCount = yield* syncHistorySource(sync, token, BinanceHistorySourceEnum.FIAT, (fromUnixTime, toUnixTime) =>
                commitFiatRange(token, fromUnixTime, toUnixTime)
            );
            if (!run.isDeferred) {
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
                Effect.andThen(() => processTransfers(sync, externalAccountId, token)),
                Effect.map(addChangedCount),
                Effect.andThen(Effect.yieldNow),
                Effect.andThen(() => processFiatSource(sync, token)),
                Effect.map(addChangedCount),
                Effect.catchTag('SyncDeferredError', () => markRunDeferred)
            );

            return changedCount;
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

                if (!getTokenRun(token).balancesAnchored) {
                    yield* anchorAllBalances(token).pipe(Effect.catchTag('SyncDeferredError', () => markRunDeferred));
                }

                const changedCount = run.isDeferred
                    ? 0
                    : yield* Effect.ensuring(
                          runSyncPhases(sync, externalAccountId, token),
                          Effect.orDie(Effect.suspend(() => binanceTradeCursorService.persistRunWarning(sync, getRunSignedClient(token))))
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
                Effect.map(Clock.currentTimeMillis, startedAtMs => {
                    run = freshRunState(deadlineAtMs, startedAtMs);
                }),
            afterSyncRun: () => {
                run = freshRunState(Number.POSITIVE_INFINITY, 0);
            },
            isRunWorkComplete: () =>
                run.tokenRuns.size > 0 && [...run.tokenRuns.values()].every(tokenRun => tokenRun.sourcesSynced && tokenRun.transfersSynced),
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
            ImportedTransactionEntryUpdateService.layer,
            TransferCreationService.layer,
            BinanceAccountService.layer,
            BinanceAssetCodeService.layer,
            BinanceHistoryProgressService.layer,
            BinanceSourceQuoteService.layer,
            BinanceTradeCursorService.layer
        ])
    );
}
