import { buildConsolidationScopeFromTransactions } from '@budgie/consolidation';
import {
    AccountRepository,
    InstrumentRepository,
    MccCategoryRepository,
    SettingsRepository,
    SyncModeEnum,
    TransactionRepository,
    ExternalSourceEnum,
    loadMccCategoryLookupMap
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { RuleEngineService } from '@budgie/rules';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncConsentExpiredError } from '../../core/error/sync-consent-expired.error';
import { SyncDeferredError } from '../../core/error/sync-deferred.error';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncWorkload } from '../../core/port/sync-workload.port';
import { mapBankTransactionToCreateInput } from '../../core/utils/map-bank-transaction-to-create-input.util';
import { EnableBankingErrorCodeEnum } from '../enum/enable-banking-error-code.enum';
import { enableBankingMapper } from '../mapper/enable-banking.mapper';

import { EnableBankingClientService } from './enable-banking-client.service';

import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { EnableBankingTokenInterface } from '../constant/enable-banking-token.schema';
import type { EnableBankingBatchContextInterface } from '../interface/enable-banking-batch-context.interface';
import type { EnableBankingSessionApiInterface } from '../interface/enable-banking-session-api.schema';
import type { EnableBankingTransactionQueryInterface } from '../interface/enable-banking-transaction-query.interface';
import type { MccCategoryLookupInterface, SyncEntityInterface } from '@budgie/contracts';

export class EnableBankingBatchService extends Context.Service<EnableBankingBatchService>()('@budgie/sync/EnableBankingBatchService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const mccCategoryRepository = yield* MccCategoryRepository;
        const settingsRepository = yield* SettingsRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionService = yield* TransactionService;
        const ruleEngineService = yield* RuleEngineService;
        const syncWorkload = yield* SyncWorkload;
        const clientService = yield* EnableBankingClientService;
        const provider = ExternalSourceEnum.ENABLE_BANKING;
        const syncProvider = SyncProviderEnum.ENABLE_BANKING;
        const millisecondsPerSecond = 1000;
        const millisecondsPerDay = 24 * 60 * 60 * millisecondsPerSecond;
        const lookbackMs = 7 * millisecondsPerDay;
        const isoDateLength = 10;
        const authorizedSessionStatus = 'AUTHORIZED';
        const sessionByToken = new Map<string, EnableBankingSessionApiInterface>();
        let mccCategoryLookupMap = new Map<string, MccCategoryLookupInterface>();

        const failInvalid = (message: string) => new SyncInvalidResponseError({ provider: syncProvider, message });

        const failConsentExpired = () =>
            new SyncConsentExpiredError({ provider: syncProvider, message: 'The bank consent has expired or was revoked' });

        const failAccountNotLinked = () =>
            new SyncInvalidResponseError({
                provider: syncProvider,
                message: 'The account is not linked to this bank authorization',
                apiCode: EnableBankingErrorCodeEnum.ACCOUNT_NOT_LINKED
            });

        const hasApiCode =
            (apiCode: EnableBankingErrorCodeEnum) =>
            (error: unknown): boolean =>
                error instanceof SyncInvalidResponseError && error.apiCode === apiCode;

        const isBankRateLimited = hasApiCode(EnableBankingErrorCodeEnum.ASPSP_RATE_LIMIT_EXCEEDED);
        const isWrongTransactionsPeriod = hasApiCode(EnableBankingErrorCodeEnum.WRONG_TRANSACTIONS_PERIOD);

        const resolveSession = Effect.fnUntraced(function* (token: string, credentials: EnableBankingTokenInterface) {
            const cachedSession = sessionByToken.get(token);
            if (isDefined(cachedSession)) {
                return cachedSession;
            }

            const session = yield* clientService.withClient(credentials.applicationId, client => client.getSession(credentials.sessionId));
            sessionByToken.set(token, session);

            return session;
        });

        const resolveAccountUid = Effect.fnUntraced(function* (token: string, credentials: EnableBankingTokenInterface, hash: string) {
            if (Date.parse(credentials.validUntil) <= (yield* Clock.currentTimeMillis)) {
                return yield* failConsentExpired();
            }

            const session = yield* resolveSession(token, credentials);
            if (session.status !== authorizedSessionStatus) {
                return yield* failConsentExpired();
            }

            const accountUid = session.accounts_data.find(item => item.identification_hash === hash)?.uid;

            return isDefined(accountUid) ? accountUid : yield* failAccountNotLinked();
        });

        const fetchBatchData = Effect.fnUntraced(function* (
            { client, accountUid, hash, currencyCode, fetchStartedAt }: EnableBankingBatchContextInterface,
            query: EnableBankingTransactionQueryInterface
        ) {
            const { balances } = yield* client.getBalances(accountUid);
            const balanceSnapshot = enableBankingMapper.resolveBalanceSnapshot(balances, currencyCode, fetchStartedAt);
            if (!isDefined(balanceSnapshot)) {
                return yield* failInvalid('This bank exposes no booked balance and is not supported');
            }

            const rows = yield* client
                .getBookedTransactions(accountUid, query)
                .pipe(
                    Effect.catchIf(isWrongTransactionsPeriod, () =>
                        client.getBookedTransactions(accountUid, { dateFrom: null, isLongest: true })
                    )
                );
            const transactions = enableBankingMapper.mapTransactions(hash, currencyCode, rows);
            if (!isDefined(transactions)) {
                return yield* failInvalid('This bank returned transactions that cannot be stored safely and is not supported');
            }

            return { balanceSnapshot, transactions };
        });

        const commitNewTransactions = Effect.fnUntraced(function* (transactions: SyncTransactionInterface[], accountId: number) {
            if (!isNotEmptyArray(transactions)) {
                return 0;
            }

            const existingIds = yield* transactionRepository.findIdMapByExternalSource(provider, [accountId]);
            const deletedIds = new Set(yield* transactionRepository.findDeletedExternalIdsByExternalSource(provider, [accountId]));
            const newTransactions = transactions.filter(transaction => !existingIds.has(transaction.id) && !deletedIds.has(transaction.id));
            if (!isNotEmptyArray(newTransactions)) {
                return 0;
            }

            const prepared = yield* ruleEngineService.prepareCreateInputsForRules(
                newTransactions.map(transaction =>
                    mapBankTransactionToCreateInput(
                        transaction,
                        accountId,
                        mccCategoryLookupMap.get(String(transaction.mcc)) ?? null,
                        provider
                    )
                )
            );
            const created = yield* transactionService.bulkCreate(prepared.transactionInputs);
            const ruleTransactionIds = prepared.postCreateIndexes.map(index => created[index]?.id).filter(isDefined);
            if (isNotEmptyArray(ruleTransactionIds)) {
                yield* syncWorkload.enqueueRuleApplication(
                    ruleTransactionIds,
                    prepared.postCreateIndexes.map(index => prepared.transactionInputs[index]).filter(isDefined)
                );
            }

            const consolidationScope = buildConsolidationScopeFromTransactions(created);
            if (isDefined(consolidationScope)) {
                yield* syncWorkload.enqueueTransferConsolidation(consolidationScope);
            }

            return created.length;
        });

        const floorToDayMs = (timeMs: number): number => timeMs - (timeMs % millisecondsPerDay);

        const toIsoDate = (timeMs: number): string => new Date(timeMs).toISOString().slice(0, isoDateLength);

        const commitFetched = Effect.fnUntraced(function* (
            fetched: Effect.Success<ReturnType<typeof fetchBatchData>>,
            keepFromMs: number,
            sync: SyncEntityInterface,
            fetchStartedAt: Date
        ) {
            const transactionCount = yield* commitNewTransactions(
                fetched.transactions.filter(transaction => transaction.time * millisecondsPerSecond >= keepFromMs),
                sync.accountId
            );

            return {
                transactions: [],
                transactionCount,
                completed: true,
                nextFrom: fetchStartedAt,
                nextTo: fetchStartedAt,
                balanceSnapshot: fetched.balanceSnapshot
            };
        });

        const syncForward = Effect.fnUntraced(function* (context: EnableBankingBatchContextInterface, sync: SyncEntityInterface) {
            const cursor = sync.forwardSyncFromAt ?? context.fetchStartedAt;
            const keepFromMs = floorToDayMs(cursor.getTime() - lookbackMs);
            const fetched = yield* fetchBatchData(context, { dateFrom: toIsoDate(keepFromMs), isLongest: false }).pipe(
                Effect.catchIf(isBankRateLimited, () => Effect.succeed(null))
            );
            if (!isDefined(fetched)) {
                return { transactions: [], completed: true, nextFrom: cursor, nextTo: cursor };
            }

            return yield* commitFetched(fetched, keepFromMs, sync, context.fetchStartedAt);
        });

        const syncBackward = Effect.fnUntraced(function* (context: EnableBankingBatchContextInterface, sync: SyncEntityInterface) {
            const fetched = yield* fetchBatchData(context, { dateFrom: null, isLongest: true }).pipe(
                Effect.catchIf(isBankRateLimited, () =>
                    Effect.fail(new SyncDeferredError({ provider: syncProvider, message: 'The bank fetch allowance is used up' }))
                )
            );

            return yield* commitFetched(fetched, 0, sync, context.fetchStartedAt);
        });

        return {
            beforeRun: Effect.fn('EnableBankingBatchService.beforeRun')(function* () {
                sessionByToken.clear();
                mccCategoryLookupMap = yield* loadMccCategoryLookupMap(mccCategoryRepository, settingsRepository);
            }),
            execute: Effect.fn('EnableBankingBatchService.execute')(function* (sync: SyncEntityInterface, token: string) {
                const nowMs = yield* Clock.currentTimeMillis;
                const fetchStartedAt = new Date(Math.floor(nowMs / millisecondsPerSecond) * millisecondsPerSecond);
                const isBackward = sync.mode === SyncModeEnum.BACKWARD;
                const credentials = yield* clientService.decodeCredentials(token);
                const account = yield* accountRepository.findById(sync.accountId);
                const hash = account?.externalId;
                if (!isDefined(account) || !isNotEmptyString(hash)) {
                    return yield* failAccountNotLinked();
                }

                const currencyCode = (yield* instrumentRepository.getAll()).find(
                    instrument => instrument.id === account.instrumentId
                )?.code;
                if (!isDefined(currencyCode)) {
                    return yield* failInvalid('The account currency is not known');
                }

                const accountUid = yield* resolveAccountUid(token, credentials, hash);

                return yield* clientService.withClient(credentials.applicationId, client => {
                    const context = { client, accountUid, hash, currencyCode, fetchStartedAt };

                    return isBackward ? syncBackward(context, sync) : syncForward(context, sync);
                });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(EnableBankingBatchService, EnableBankingBatchService.make).pipe(
        Layer.provide([
            pollingSyncDependenciesLayer,
            EnableBankingClientService.layer,
            MccCategoryRepository.layer,
            RuleEngineService.layer,
            SettingsRepository.layer
        ])
    );
}
