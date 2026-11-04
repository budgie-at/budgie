import {
    AccountRepository,
    AccountTypeEnum,
    BankIntegrationRepository,
    Db,
    ExternalSourceEnum,
    InstrumentRepository,
    SyncModeEnum,
    SyncRepository,
    SyncStatusEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { SyncHistoryDepthEnum } from '../../core/enum/sync-history-depth.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncConsentExpiredError } from '../../core/error/sync-consent-expired.error';
import { SyncTokenClientMismatchError } from '../../core/error/sync-token-client-mismatch.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { pollingSyncDependenciesLayer } from '../../core/layer/polling-sync-dependencies.layer';
import { SyncRequestSigner } from '../../core/port/sync-request-signer.port';
import { SyncBalanceReconciliationService } from '../../core/service/sync-balance-reconciliation.service';
import { SyncIntegrationTokenService } from '../../core/service/sync-integration-token.service';
import { generateDefaultSyncAccountTitle } from '../../core/utils/generate-default-sync-account-title.util';
import { makePollingSyncAccountSetup } from '../../core/utils/make-polling-sync-account-setup.util';
import { makePollingSyncService } from '../../core/utils/make-polling-sync-service.util';
import { resolveSyncProgressUpdate } from '../../core/utils/resolve-sync-progress-update.util';
import { enableBankingMapper } from '../mapper/enable-banking.mapper';

import { EnableBankingBatchService } from './enable-banking-batch.service';
import { EnableBankingCallbackService } from './enable-banking-callback.service';
import { EnableBankingClientService } from './enable-banking-client.service';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncBatchResultInterface } from '../../core/interface/sync-batch-result.interface';
import type { EnableBankingTokenInterface } from '../constant/enable-banking-token.schema';
import type { EnableBankingAuthorizationResultInterface } from '../interface/enable-banking-authorization-result.interface';
import type { EnableBankingBankInterface } from '../interface/enable-banking-bank.interface';
import type { EnableBankingDisconnectResultInterface } from '../interface/enable-banking-disconnect-result.interface';
import type { EnableBankingPendingAuthorizationInterface } from '../interface/enable-banking-pending-authorization.interface';
import type { EnableBankingStartAuthorizationInputInterface } from '../interface/enable-banking-start-authorization-input.interface';
import type { SyncEntityInterface } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

export class EnableBankingSyncService extends Context.Service<EnableBankingSyncService>()('@budgie/sync/EnableBankingSyncService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const syncRepository = yield* SyncRepository;
        const accountArchiveService = yield* AccountArchiveService;
        const syncBalanceReconciliationService = yield* SyncBalanceReconciliationService;
        const syncIntegrationTokenService = yield* SyncIntegrationTokenService;
        const syncRequestSigner = yield* SyncRequestSigner;
        const batchService = yield* EnableBankingBatchService;
        const callbackService = yield* EnableBankingCallbackService;
        const clientService = yield* EnableBankingClientService;
        const provider = ExternalSourceEnum.ENABLE_BANKING;
        const createOrUpdateSync = yield* makePollingSyncAccountSetup(provider);
        const millisecondsPerSecond = 1000;
        const forwardSyncStaleThresholdMs = 8 * 60 * 60 * millisecondsPerSecond;
        const consentMarginSeconds = 60;
        const pendingAuthorizationLifetimeMs = 30 * 60 * millisecondsPerSecond;

        const applyProgressUpdate = Effect.fnUntraced(function* (sync: SyncEntityInterface, result: SyncBatchResultInterface) {
            const isFetchedHistory = sync.mode === SyncModeEnum.BACKWARD && isDefined(result.balanceSnapshot);
            yield* syncRepository.update(sync.id, {
                ...resolveSyncProgressUpdate(sync, result),
                ...(isFetchedHistory && { forwardSyncedAt: new Date(), forwardSyncFromAt: result.nextFrom })
            });
            if (result.completed && isDefined(result.balanceSnapshot)) {
                yield* syncBalanceReconciliationService.reconcile(sync.accountId, result.balanceSnapshot);
            }
        });

        const pollingSyncService = yield* makePollingSyncService({
            provider,
            accountType: AccountTypeEnum.BANK_SYNC,
            generateAccountTitle: account =>
                isNotEmptyString(account.title) ? account.title : generateDefaultSyncAccountTitle('Bank', account),
            accountIcon: () => UserIconNameEnum.Landmark,
            rateLimitMs: 0,
            forwardSyncStaleThresholdMs,
            isBackwardForegroundOnly: true,
            executeSyncBatch: (sync, token) => batchService.execute(sync, token),
            applyProgressUpdate,
            beforeSyncRun: () => batchService.beforeRun(),
            afterSyncRun: () => {
                batchService.afterRun();
            },
            isRetryableError: () => false,
            isCredentialWideError: error => error instanceof SyncUnauthorizedError || error instanceof SyncConsentExpiredError,
            shouldKeepFailedSyncEnabledAfterError: () => true
        });

        const findUnconnectableExternalIds = Effect.fnUntraced(function* (accounts: readonly SyncAccountInterface[]) {
            const instrumentCodes = new Set((yield* instrumentRepository.getAll()).map(instrument => instrument.code));
            const ibans = accounts.map(account => account.iban).filter(isNotEmptyString);
            const accountsWithIban = isNotEmptyArray(ibans) ? yield* accountRepository.findByIbans(ibans) : [];

            return new Set(
                accounts
                    .filter(
                        account =>
                            !instrumentCodes.has(account.currencyCode) ||
                            accountsWithIban.some(existing => existing.iban === account.iban && existing.externalId !== account.id)
                    )
                    .map(account => account.id)
            );
        });

        const findIntegrationIdByAccounts = Effect.fnUntraced(function* (accounts: readonly SyncAccountInterface[]) {
            const linkedAccounts = yield* accountRepository.findByExternalIds(accounts.map(account => account.id));

            return (
                linkedAccounts
                    .filter(account => account.externalSource === provider)
                    .map(account => account.integrationId)
                    .find(isDefined) ?? null
            );
        });

        const applyReconsent = Effect.fnUntraced(function* (
            integrationId: number,
            token: string,
            accounts: readonly SyncAccountInterface[],
            revokeNewSession: Effect.Effect<void, never, HttpClient.HttpClient>
        ) {
            const linkedAccounts = yield* accountRepository.findByIntegrationId(integrationId);
            const authorizedIds = new Set(accounts.map(account => account.id));
            if (isNotEmptyArray(linkedAccounts) && !linkedAccounts.some(account => authorizedIds.has(account.externalId ?? ''))) {
                yield* revokeNewSession;

                return yield* new SyncTokenClientMismatchError({
                    provider: SyncProviderEnum.ENABLE_BANKING,
                    integrationId,
                    message: 'This bank authorization does not cover the connected accounts'
                });
            }

            yield* Db.transaction(
                Effect.gen(function* () {
                    yield* syncIntegrationTokenService.updateIntegrationToken(integrationId, token);
                    for (const account of linkedAccounts) {
                        const sync = yield* syncRepository.getByAccountId(account.id);
                        if (isDefined(sync)) {
                            yield* syncRepository.update(sync.id, {
                                forwardSyncedAt: null,
                                status: SyncStatusEnum.IDLE,
                                lastErrorCode: null
                            });
                        }
                    }
                })
            );
        });

        const findOtherLiveApplicationIds = Effect.fnUntraced(function* (integrationId: number) {
            const integrationIds = new Set(
                (yield* accountRepository.findByExternalSource(provider))
                    .map(account => account.integrationId)
                    .filter(isDefined)
                    .filter(otherIntegrationId => otherIntegrationId !== integrationId)
            );
            const applicationIds = new Set<string>();
            for (const otherIntegrationId of integrationIds) {
                const otherIntegration = yield* bankIntegrationRepository.findById(otherIntegrationId);
                const credentials = isDefined(otherIntegration)
                    ? yield* clientService.decodeCredentials(otherIntegration.token).pipe(Effect.orElseSucceed(() => null))
                    : null;
                if (isDefined(credentials)) {
                    applicationIds.add(credentials.applicationId);
                }
            }

            return applicationIds;
        });

        const removeLocally = Effect.fnUntraced(function* (integrationId: number) {
            for (const account of yield* accountRepository.findByIntegrationId(integrationId)) {
                yield* accountArchiveService.archiveById(account.id);
                yield* syncRepository.setEnabled(account.id, false);
            }
            yield* bankIntegrationRepository.deleteIfUnreferenced(integrationId);
        });

        return {
            ...pollingSyncService,
            listBanks: Effect.fn('EnableBankingSyncService.listBanks')(function* (applicationId: string, country: string | null = null) {
                const { aspsps } = yield* clientService.withClient(applicationId, client => client.getAspsps(country));

                return aspsps.map((aspsp): EnableBankingBankInterface => ({
                    name: aspsp.name,
                    country: aspsp.country,
                    logoUrl: aspsp.logo ?? null,
                    maximumConsentValiditySeconds: aspsp.maximum_consent_validity,
                    isBeta: aspsp.beta === true,
                    isSupported: !isNotEmptyArray(aspsp.required_psu_headers ?? [])
                }));
            }),
            validateCredentials: Effect.fn('EnableBankingSyncService.validateCredentials')(function* (applicationId: string) {
                yield* clientService.forgetJwt(applicationId);
                const application = yield* clientService.withClient(applicationId, client => client.getApplication());

                return {
                    name: application.name,
                    isActive: application.active,
                    environment: application.environment,
                    redirectUrls: application.redirect_urls
                };
            }),
            startAuthorization: Effect.fn('EnableBankingSyncService.startAuthorization')(function* (
                input: EnableBankingStartAuthorizationInputInterface
            ) {
                const nowMs = yield* Clock.currentTimeMillis;
                const state = yield* syncRequestSigner.generateState;
                const { url } = yield* clientService.withClient(input.applicationId, client =>
                    client.startAuthorization({
                        access: {
                            valid_until: new Date(
                                nowMs + (input.maximumConsentValiditySeconds - consentMarginSeconds) * millisecondsPerSecond
                            ).toISOString()
                        },
                        aspsp: { name: input.aspspName, country: input.aspspCountry },
                        state,
                        redirect_url: input.redirectUrl,
                        psu_type: 'personal'
                    })
                );
                const pending: EnableBankingPendingAuthorizationInterface = {
                    state,
                    applicationId: input.applicationId,
                    aspspName: input.aspspName,
                    aspspCountry: input.aspspCountry,
                    integrationId: input.integrationId,
                    callbackUrl: input.callbackUrl,
                    expiresAtMs: nowMs + pendingAuthorizationLifetimeMs
                };

                return { url, pending };
            }),
            completeAuthorization: Effect.fn('EnableBankingSyncService.completeAuthorization')(function* (
                pending: EnableBankingPendingAuthorizationInterface,
                callbackUrl: string
            ) {
                const code = yield* callbackService.resolveCode(pending, callbackUrl);
                const session = yield* clientService.withClient(pending.applicationId, client => client.authorizeSession(code));
                const token = JSON.stringify({
                    applicationId: pending.applicationId,
                    sessionId: session.session_id,
                    aspspName: session.aspsp.name,
                    aspspCountry: session.aspsp.country,
                    validUntil: session.access.valid_until
                } satisfies EnableBankingTokenInterface);
                const accounts = session.accounts.map(account => enableBankingMapper.mapAccount(session.aspsp.name, account));
                const reconsentIntegrationId = pending.integrationId ?? (yield* findIntegrationIdByAccounts(accounts));
                if (isDefined(reconsentIntegrationId)) {
                    yield* applyReconsent(
                        reconsentIntegrationId,
                        token,
                        accounts,
                        clientService
                            .withClient(pending.applicationId, client => client.deleteSession(session.session_id))
                            .pipe(Effect.ignore)
                    );
                    yield* pollingSyncService.requestSync();
                }

                const integrationId =
                    reconsentIntegrationId ?? (yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token)).id;
                yield* syncIntegrationTokenService.fillIntegrationLabel(integrationId, session.aspsp.name);
                const unconnectableIds = yield* findUnconnectableExternalIds(accounts);

                return {
                    integrationId,
                    isReconsent: isDefined(reconsentIntegrationId),
                    accounts,
                    previews: yield* pollingSyncService.mapAccountsToPreview(accounts, account => unconnectableIds.has(account.id))
                } satisfies EnableBankingAuthorizationResultInterface;
            }),
            setupAccountSyncBatch: Effect.fn('EnableBankingSyncService.setupAccountSyncBatch')(function* (
                integrationId: number,
                accounts: SyncAccountInterface[],
                externalIds: readonly string[],
                historyDepth: SyncHistoryDepthEnum = SyncHistoryDepthEnum.FULL
            ) {
                const integration = yield* bankIntegrationRepository.findById(integrationId);
                if (!isDefined(integration)) {
                    return yield* Effect.die(new Error('Bank integration not found'));
                }

                const unconnectableIds = yield* findUnconnectableExternalIds(accounts);
                const selectedAccounts = accounts.filter(account => externalIds.includes(account.id) && !unconnectableIds.has(account.id));
                for (const selectedAccount of selectedAccounts) {
                    const account = yield* pollingSyncService.getOrCreateSyncAccount(selectedAccount);
                    yield* createOrUpdateSync(account.id, integration.token, historyDepth, null);
                }

                if (isNotEmptyArray(selectedAccounts)) {
                    yield* pollingSyncService.requestSync();
                }

                return selectedAccounts.length;
            }),
            disconnect: Effect.fn('EnableBankingSyncService.disconnect')(function* (integrationId: number) {
                const integration = yield* bankIntegrationRepository.findById(integrationId);
                if (!isDefined(integration)) {
                    return { isSessionRevoked: false, isKeyRemoved: false } satisfies EnableBankingDisconnectResultInterface;
                }

                const credentials = yield* clientService.decodeCredentials(integration.token).pipe(Effect.orElseSucceed(() => null));
                const isSessionRevoked = isDefined(credentials)
                    ? yield* clientService
                          .withClient(credentials.applicationId, client => client.deleteSession(credentials.sessionId))
                          .pipe(
                              Effect.as(true),
                              Effect.orElseSucceed(() => false)
                          )
                    : false;
                yield* removeLocally(integrationId);

                if (!isDefined(credentials) || (yield* findOtherLiveApplicationIds(integrationId)).has(credentials.applicationId)) {
                    return { isSessionRevoked, isKeyRemoved: false } satisfies EnableBankingDisconnectResultInterface;
                }

                yield* clientService.forgetJwt(credentials.applicationId);

                return {
                    isSessionRevoked,
                    isKeyRemoved: yield* syncRequestSigner.deleteKey(credentials.applicationId).pipe(
                        Effect.as(true),
                        Effect.orElseSucceed(() => false)
                    )
                } satisfies EnableBankingDisconnectResultInterface;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(EnableBankingSyncService, EnableBankingSyncService.make).pipe(
        Layer.provide([
            pollingSyncDependenciesLayer,
            AccountArchiveService.layer,
            BankIntegrationRepository.layer,
            SyncBalanceReconciliationService.layer,
            EnableBankingBatchService.layer,
            EnableBankingCallbackService.layer,
            EnableBankingClientService.layer
        ])
    );
}
