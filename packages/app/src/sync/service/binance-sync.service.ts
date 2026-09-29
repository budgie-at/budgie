import { P2P_ORDER_EXTERNAL_ID_MARKER, consolidationScopeService } from '@budgie/consolidation';
import { AccountTypeEnum, Db, ExternalSourceEnum, SyncModeEnum, UserIconNameEnum } from '@budgie/contracts';
import {
    BINANCE_RATE_LIMIT_MS,
    BinanceCredentialsSchema,
    BinanceSignedClient,
    SyncAccountBalanceStateEnum,
    SyncDeferredError,
    SyncInvalidResponseError,
    SyncTransactionTypeEnum,
    SyncUnauthorizedError,
    binanceMapper,
    decodeBinanceAccountId
} from '@budgie/sync';
import { getUnixTime } from 'date-fns/getUnixTime';
import { subDays } from 'date-fns/subDays';
import { subYears } from 'date-fns/subYears';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { accountBalanceRepository, accountRepository, instrumentRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { accountService } from '../../account/service/account.service';
import { importedTransactionEntryUpdateService } from '../../transaction/service/imported-transaction-entry-update.service';
import { transactionService } from '../../transaction/service/transaction.service';
import { BINANCE_SYNC_TASK } from '../constant/binance-sync-task.constant';
import { BINANCE_TRANSFER_LOOKBACK_YEARS } from '../constant/binance-transfer-lookback-years.constant';
import { TransferConsolidationDrainReasonEnum } from '../enum/transfer-consolidation-drain-reason.enum';
import { BinanceTransferInputMapper } from '../mapper/binance-transfer-input.mapper';
import { mapBankTransactionToCreateInput } from '../util/map-bank-transaction-to-create-input.util';

import { AbstractPollingSyncService } from './abstract-polling-sync.service';
import { binanceAssetCodeService } from './binance-asset-code.service';
import { binanceSourceQuoteService } from './binance-source-quote.service';
import { binanceTradeCursorService } from './binance-trade-cursor.service';
import { syncIntegrationTokenService } from './sync-integration-token.service';
import { transferConsolidationDrainerService } from './transfer-consolidation-drainer.service';

import type { BinanceResolvableAccountInterface } from '../interface/binance-resolvable-account.interface';
import type {
    AccountEntityInterface,
    InstrumentEntityInterface,
    SyncEntityInterface,
    TransactionCreateInputInterface
} from '@budgie/contracts';
import type { BinanceTransferInterface, SyncAccountInterface, SyncError, SyncTransactionInterface } from '@budgie/sync';
import type * as HttpClient from 'effect/http/HttpClient';

class AppBinanceSyncService extends AbstractPollingSyncService {
    private static readonly TRANSFER_CHUNK_SIZE = 50;
    private static readonly SOURCE_INPUT_YIELD_INTERVAL = 50;
    private static readonly FORWARD_OVERLAP_DAYS = 1;
    private static readonly FIAT_REFRESH_INTERVAL_MS = 23 * 60 * 60 * 1000;
    private static readonly decodeCredentials = Schema.decodeUnknownEffect(Schema.fromJsonString(BinanceCredentialsSchema));

    readonly fetchAccountsPreview = Effect.fn('AppBinanceSyncService.fetchAccountsPreview')(function* (
        this: AppBinanceSyncService,
        token: string
    ) {
        const exchangeAccounts = yield* this.fetchExchangeAccounts(token);
        const instruments = yield* instrumentRepository.getAll();

        return yield* this.mapAccountsToPreview(
            exchangeAccounts,
            exchangeAccount => !isDefined(this.resolveInstrument(exchangeAccount, instruments))
        );
    });

    readonly setupAccountSyncBatch = Effect.fn('AppBinanceSyncService.setupAccountSyncBatch')(function* (
        this: AppBinanceSyncService,
        token: string,
        externalIds: string[]
    ) {
        const exchangeAccounts = yield* this.fetchExchangeAccounts(token);
        const instruments = yield* instrumentRepository.getAll();
        const resolvableAccounts = exchangeAccounts
            .filter(exchangeAccount => externalIds.includes(exchangeAccount.id))
            .map(exchangeAccount => {
                const instrument = this.resolveInstrument(exchangeAccount, instruments);

                return isDefined(instrument) ? { exchangeAccount, instrumentId: instrument.id } : null;
            })
            .filter(isDefined);

        for (const resolvableAccount of resolvableAccounts) {
            yield* this.setupResolvedAccount(resolvableAccount, token);
        }

        if (isNotEmptyArray(resolvableAccounts)) {
            yield* Effect.forkDetach(this.registerBackgroundTask().pipe(Effect.ignoreCause({ log: true })));
            yield* this.requestSync();
        }

        return resolvableAccounts.length;
    }, invalidateDatabaseLiveQuery);

    protected readonly provider = ExternalSourceEnum.BINANCE;
    // eslint-disable-next-line lingui/no-unlocalized-strings -- brand name
    protected readonly providerTitle = 'Binance';
    protected readonly accountType = AccountTypeEnum.CRYPTO_SYNC;
    protected readonly rateLimitMs = BINANCE_RATE_LIMIT_MS;
    protected readonly backgroundTaskName = BINANCE_SYNC_TASK;

    protected readonly executeSyncBatch: AbstractPollingSyncService['executeSyncBatch'] = Effect.fn(
        'AppBinanceSyncService.executeSyncBatch'
    )(function* (this: AppBinanceSyncService, sync: SyncEntityInterface) {
        const account = yield* Db.query(database => accountRepository.findById(sync.accountId, database));
        const externalAccountId = account?.externalId ?? null;
        if (!isNotEmptyString(externalAccountId)) {
            return { transactions: [], nextTo: new Date(), nextFrom: new Date(), completed: true };
        }

        const token = yield* this.resolveSyncToken(sync);
        const changedCount = yield* Effect.ensuring(
            this.runSyncPhases(sync, externalAccountId, token),
            Effect.orDie(Effect.suspend(() => binanceTradeCursorService.persistRunSideEffects(sync, this.runSignedClient)))
        );
        if (isPositiveNumber(changedCount)) {
            yield* transactionService.updateAllBalances();
            yield* transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.BINANCE_SYNC);
        }

        const progressDate = this.runDeferred ? (sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date()) : new Date();

        return {
            transactions: [],
            transactionCount: changedCount,
            nextTo: progressDate,
            nextFrom: progressDate,
            completed: !this.runDeferred
        };
    });

    protected readonly beforeSyncRun: AbstractPollingSyncService['beforeSyncRun'] = Effect.fn('AppBinanceSyncService.beforeSyncRun')(
        function* (this: AppBinanceSyncService) {
            yield* Effect.sync(() => {
                this.resetRunState();
            });
        }
    );

    private readonly runSyncPhases = Effect.fn('AppBinanceSyncService.runSyncPhases')(function* (
        this: AppBinanceSyncService,
        sync: SyncEntityInterface,
        externalAccountId: string,
        token: string
    ) {
        let changedCount = 0;
        const addChangedCount = (count: number) => {
            changedCount += count;
        };

        yield* this.processSources(sync, token).pipe(
            Effect.map(addChangedCount),
            Effect.andThen(Effect.yieldNow),
            Effect.andThen(() => this.processTransfers(sync, externalAccountId, token)),
            Effect.map(addChangedCount),
            Effect.andThen(Effect.yieldNow),
            Effect.andThen(() => this.processFiatSource(sync, token)),
            Effect.map(addChangedCount),
            Effect.catchIf(
                error => error instanceof SyncDeferredError,
                () =>
                    Effect.sync(() => {
                        this.runDeferred = true;
                    })
            )
        );

        return changedCount;
    });

    private readonly fetchExchangeAccounts = Effect.fnUntraced(function* (this: AppBinanceSyncService, token: string) {
        if (isDefined(this.runExchangeAccounts) && this.runClientToken === token) {
            return this.runExchangeAccounts;
        }

        const accounts = yield* this.getRunSignedClient(token).getAccounts();
        this.runExchangeAccounts = accounts;

        return accounts;
    });

    private readonly setupResolvedAccount = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        resolvableAccount: BinanceResolvableAccountInterface,
        token: string
    ) {
        const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(this.provider, token);
        const account = yield* this.getOrCreateAccount(resolvableAccount.exchangeAccount, resolvableAccount.instrumentId, integration.id);
        if (resolvableAccount.exchangeAccount.balanceState === SyncAccountBalanceStateEnum.REPRESENTABLE) {
            yield* this.anchorAccountBalance(account.id, resolvableAccount.exchangeAccount.balance);
        }
        yield* this.createOrUpdateSync(account.id, token);
    });

    private readonly processTransfers = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        sync: SyncEntityInterface,
        externalAccountId: string,
        token: string
    ) {
        if (this.transfersSyncedThisRun) {
            return 0;
        }
        this.transfersSyncedThisRun = true;

        const transfers = yield* binanceTradeCursorService.fetchTransferBatch(this.getRunSignedClient(token), sync, externalAccountId, {
            fromUnixTime: getUnixTime(this.resolveWindowStart(sync)),
            eligibleSoldOffBaseAssets: yield* binanceAssetCodeService.resolveEligibleSoldOffBaseAssets(this.provider)
        });
        if (!isNotEmptyArray(transfers)) {
            return 0;
        }

        const existingIds = yield* transactionService.findByExternalSource(this.provider);
        const newTransfers = transfers.filter(transfer => !existingIds.has(transfer.externalId));

        return isNotEmptyArray(newTransfers) ? yield* this.createSyncedTransfers(newTransfers, token) : 0;
    });

    private readonly processSources = Effect.fnUntraced(function* (this: AppBinanceSyncService, sync: SyncEntityInterface, token: string) {
        if (this.sourcesSyncedThisRun) {
            return 0;
        }

        const client = this.getRunSignedClient(token);
        const fromUnixTime = getUnixTime(this.resolveWindowStart(sync));

        return (
            (yield* this.commitSourceType(token, client.getC2cTransactions(fromUnixTime), true)) +
            (yield* this.commitSourceType(token, client.getEarnTransactions(fromUnixTime), false)) +
            (yield* this.commitSourceType(token, client.getCapitalTransactions(fromUnixTime), false))
        );
    });

    private readonly processFiatSource = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        sync: SyncEntityInterface,
        token: string
    ) {
        if (this.sourcesSyncedThisRun) {
            return 0;
        }

        let createdCount = 0;
        if (!isDefined(this.fiatSyncedAtMs) || Date.now() - this.fiatSyncedAtMs >= AppBinanceSyncService.FIAT_REFRESH_INTERVAL_MS) {
            const client = this.getRunSignedClient(token);
            createdCount += yield* this.commitSourceType(
                token,
                client.getFiatTransactions(getUnixTime(this.resolveWindowStart(sync))),
                false
            );
            this.fiatSyncedAtMs = Date.now();
        }
        this.sourcesSyncedThisRun = true;

        return createdCount;
    });

    private readonly commitSourceType = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        token: string,
        fetchSourceType: Effect.Effect<SyncTransactionInterface[], SyncError, HttpClient.HttpClient>,
        enqueueExistingConsolidation: boolean
    ) {
        const transactions = yield* fetchSourceType.pipe(
            Effect.tapError(() =>
                Effect.sync(() => {
                    this.providerSourceFailedThisRun = true;
                })
            )
        );
        if (!isNotEmptyArray(transactions)) {
            return 0;
        }

        const existingIdMap = yield* transactionService.findIdMapByExternalSource(this.provider);
        const existingTransactions = transactions.filter(sourceTransaction => existingIdMap.has(sourceTransaction.id));
        const reconciledCount = yield* this.reconcileSourceAccounts(existingTransactions, token, existingIdMap);
        if (enqueueExistingConsolidation) {
            yield* this.enqueueExistingSourceConsolidation(existingTransactions, existingIdMap);
        }

        const newTransactions = transactions.filter(sourceTransaction => !existingIdMap.has(sourceTransaction.id));

        return isNotEmptyArray(newTransactions)
            ? reconciledCount + (yield* this.createSyncedSources(newTransactions, token))
            : reconciledCount;
    });

    private readonly enqueueExistingSourceConsolidation = Effect.fnUntraced(function* (
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

        const consolidationScope = consolidationScopeService.buildFromTransactions(yield* transactionRepository.findByIds(transactionIds));
        if (isDefined(consolidationScope)) {
            yield* transferConsolidationDrainerService.enqueue(TransferConsolidationDrainReasonEnum.BINANCE_SYNC, consolidationScope);
        }
    });

    private readonly reconcileSourceAccounts = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        transactions: SyncTransactionInterface[],
        token: string,
        existingIdMap: ReadonlyMap<string, number>
    ) {
        const resolveAccount = yield* this.buildRunAccountResolver(token);
        let reconciledCount = 0;
        for (const transaction of transactions) {
            reconciledCount += yield* this.reconcileSourceAccount(transaction, resolveAccount, existingIdMap);
        }

        return reconciledCount;
    });

    private readonly reconcileSourceAccount = Effect.fnUntraced(function* <E, R>(
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

    private readonly createSyncedSources = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        transactions: SyncTransactionInterface[],
        token: string
    ) {
        const resolveAccount = yield* this.buildRunAccountResolver(token);
        const inputs: TransactionCreateInputInterface[] = [];
        for (const [index, transaction] of transactions.entries()) {
            if (isPositiveNumber(index) && index % AppBinanceSyncService.SOURCE_INPUT_YIELD_INTERVAL === 0) {
                yield* Effect.yieldNow;
            }
            const account = yield* resolveAccount(transaction.accountId);
            if (isDefined(account)) {
                inputs.push(
                    yield* binanceSourceQuoteService.applyToInput(
                        mapBankTransactionToCreateInput(transaction, account.id, null, this.provider),
                        transaction
                    )
                );
            }
        }

        return isNotEmptyArray(inputs) ? (yield* transactionService.bulkCreate(inputs)).length : 0;
    });

    private readonly createSyncedTransfers = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        transfers: BinanceTransferInterface[],
        token: string
    ) {
        const inputs = yield* new BinanceTransferInputMapper(yield* this.buildRunAccountResolver(token)).map(transfers);

        let createdCount = 0;
        for (let index = 0; index < inputs.length; index += AppBinanceSyncService.TRANSFER_CHUNK_SIZE) {
            createdCount += (yield* transactionService.createSyncedTransfers(
                inputs.slice(index, index + AppBinanceSyncService.TRANSFER_CHUNK_SIZE)
            )).length;
            yield* Effect.yieldNow;
        }

        return createdCount;
    });

    private readonly anchorAllBalances = Effect.fnUntraced(function* (this: AppBinanceSyncService, token: string) {
        const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(this.provider, token);
        const accounts = yield* accountRepository.findByExternalSource(this.provider);
        yield* Effect.forEach(
            accounts.filter(account => account.type === AccountTypeEnum.CRYPTO_SYNC && !isDefined(account.integrationId)),
            account => accountRepository.updateById(account.id, { integrationId: integration.id }),
            { concurrency: 'unbounded', discard: true }
        );
        const exchangeAccounts = yield* this.fetchExchangeAccounts(token);
        const exchangeAccountByExternalId = new Map(exchangeAccounts.map(exchangeAccount => [exchangeAccount.id, exchangeAccount]));
        for (const account of accounts) {
            const exchangeAccount = isNotEmptyString(account.externalId) ? exchangeAccountByExternalId.get(account.externalId) : null;
            if (!isDefined(exchangeAccount) || exchangeAccount.balanceState === SyncAccountBalanceStateEnum.REPRESENTABLE) {
                yield* this.anchorAccountBalance(account.id, exchangeAccount?.balance ?? 0);
            }
        }
    });

    private readonly buildRunAccountResolver = Effect.fnUntraced(function* (this: AppBinanceSyncService, token: string) {
        const exchangeAccounts = new Map((yield* this.fetchExchangeAccounts(token)).map(account => [account.id, account]));
        const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(this.provider, token);
        const instruments = yield* instrumentRepository.getAll();

        return (codecAccountId: string) => {
            const exchangeAccount = exchangeAccounts.get(codecAccountId) ?? this.decodeExchangeAccount(codecAccountId);
            const instrument = isDefined(exchangeAccount) ? this.resolveInstrument(exchangeAccount, instruments) : null;
            const resolvableAccount =
                isDefined(exchangeAccount) && isDefined(instrument) ? { exchangeAccount, instrumentId: instrument.id } : null;

            return this.resolveTransferAccount(codecAccountId, resolvableAccount, integration.id);
        };
    });

    private readonly resolveTransferAccount = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        codecAccountId: string,
        resolvableAccount: BinanceResolvableAccountInterface | null,
        integrationId: number
    ) {
        const existingAccount = (yield* accountRepository.findByExternalIds([codecAccountId])).at(0);
        if (isDefined(existingAccount)) {
            return existingAccount;
        }

        return isDefined(resolvableAccount)
            ? yield* this.getOrCreateAccount(resolvableAccount.exchangeAccount, resolvableAccount.instrumentId, integrationId)
            : null;
    });

    private readonly anchorAccountBalance = Effect.fnUntraced(function* (accountId: number, balance: number) {
        yield* accountBalanceRepository.upsert({ accountId, amount: convertToMicroUnits(balance) });
    });

    private readonly getOrCreateAccount = Effect.fnUntraced(function* (
        this: AppBinanceSyncService,
        exchangeAccount: SyncAccountInterface,
        instrumentId: number,
        integrationId: number
    ) {
        const existingAccount = (yield* accountRepository.findByExternalIds([exchangeAccount.id])).at(0);
        if (isDefined(existingAccount)) {
            return existingAccount;
        }

        const createdAccount = Object.values(
            yield* accountService.bulkCreate([{ ...this.mapAccountToCreateInput(exchangeAccount, instrumentId), integrationId }])
        ).at(0);
        if (!isDefined(createdAccount)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error message, never user-facing
            return yield* Effect.die(new Error('Failed to create Binance account'));
        }

        return createdAccount;
    });

    private transfersSyncedThisRun = false;
    private sourcesSyncedThisRun = false;
    private balancesAnchoredThisRun = false;
    private runSignedClient: BinanceSignedClient | null = null;
    private runClientToken: string | null = null;
    private runExchangeAccounts: SyncAccountInterface[] | null = null;
    private fiatSyncedAtMs: number | null = null;
    private providerSourceFailedThisRun = false;

    protected override beforeProcessRun(firstSyncToken: string) {
        if (this.balancesAnchoredThisRun) {
            return Effect.void;
        }
        this.balancesAnchoredThisRun = true;

        return this.anchorAllBalances(firstSyncToken);
    }

    protected override validateToken(token: string) {
        return AppBinanceSyncService.decodeCredentials(token);
    }

    protected override afterSyncRun(): void {
        this.resetRunState();
    }

    protected override isRunWorkComplete(): boolean {
        return this.sourcesSyncedThisRun && this.transfersSyncedThisRun;
    }

    protected override isRetryableError(error: unknown): boolean {
        return !(error instanceof SyncUnauthorizedError || error instanceof SyncInvalidResponseError || error instanceof SyncDeferredError);
    }

    protected override isCredentialWideError(error: unknown): boolean {
        return error instanceof SyncUnauthorizedError;
    }

    protected override shouldKeepSyncsEnabledAfterError(error: unknown): boolean {
        return this.providerSourceFailedThisRun && error instanceof SyncInvalidResponseError;
    }

    protected override generateAccountTitle(account: SyncAccountInterface): string {
        return isNotEmptyString(account.title) ? account.title : super.generateAccountTitle(account);
    }

    protected override accountIcon(): UserIconNameEnum {
        return UserIconNameEnum.Bitcoin;
    }

    private decodeExchangeAccount(codecAccountId: string): SyncAccountInterface | null {
        const decoded = decodeBinanceAccountId(codecAccountId);

        return isDefined(decoded) ? binanceMapper.mapBalanceToAccount(decoded.asset, decoded.wallet, 0) : null;
    }

    private resetRunState(): void {
        this.transfersSyncedThisRun = false;
        this.sourcesSyncedThisRun = false;
        this.balancesAnchoredThisRun = false;
        this.runSignedClient = null;
        this.runClientToken = null;
        this.runExchangeAccounts = null;
        this.providerSourceFailedThisRun = false;
    }

    private resolveWindowStart(sync: SyncEntityInterface): Date {
        if (sync.mode === SyncModeEnum.BACKWARD) {
            return subYears(sync.backwardSyncFromAt ?? sync.forwardSyncFromAt ?? new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);
        }

        if (isDefined(sync.forwardSyncedAt)) {
            return subDays(sync.forwardSyncedAt, AppBinanceSyncService.FORWARD_OVERLAP_DAYS);
        }

        return subYears(sync.forwardSyncFromAt ?? new Date(), BINANCE_TRANSFER_LOOKBACK_YEARS);
    }

    private getRunSignedClient(token: string): BinanceSignedClient {
        if (!isDefined(this.runSignedClient) || this.runClientToken !== token) {
            this.runSignedClient = new BinanceSignedClient(token, this.runDeadlineAtMs);
            this.runClientToken = token;
            this.runExchangeAccounts = null;
        }

        return this.runSignedClient;
    }

    private resolveInstrument(exchangeAccount: SyncAccountInterface, instruments: InstrumentEntityInterface[]) {
        const instrumentCode = binanceAssetCodeService.resolveInstrumentCode(exchangeAccount.currencyCode);

        return instruments.find(instrument => instrument.code === instrumentCode) ?? null;
    }
}

export const binanceSyncService = new AppBinanceSyncService();
