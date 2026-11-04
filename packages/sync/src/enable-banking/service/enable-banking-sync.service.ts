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
import { sql } from 'drizzle-orm';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

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
import { EnableBankingCallbackFailureEnum } from '../enum/enable-banking-callback-failure.enum';
import { EnableBankingCallbackError } from '../error/enable-banking-callback.error';
import { enableBankingMapper } from '../mapper/enable-banking.mapper';

import { EnableBankingBatchService } from './enable-banking-batch.service';
import { EnableBankingClientService } from './enable-banking-client.service';

import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { SyncBatchResultInterface } from '../../core/interface/sync-batch-result.interface';
import type { EnableBankingPendingAuthorizationInterface } from '../constant/enable-banking-pending-authorization.schema';
import type { EnableBankingTokenInterface } from '../constant/enable-banking-token.schema';
import type { EnableBankingAuthorizationResultInterface } from '../interface/enable-banking-authorization-result.interface';
import type { EnableBankingBankInterface } from '../interface/enable-banking-bank.interface';
import type { EnableBankingStartAuthorizationInputInterface } from '../interface/enable-banking-start-authorization-input.interface';
import type { SyncEntityInterface } from '@budgie/contracts';

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

        const resolveCode = Effect.fnUntraced(function* (pending: EnableBankingPendingAuthorizationInterface, callbackUrl: string) {
            const fail = (failure: EnableBankingCallbackFailureEnum) => new EnableBankingCallbackError({ failure });
            const [baseUrl, query, ...extraParts] = callbackUrl.split('?');
            if (baseUrl !== pending.callbackUrl || !isNotEmptyString(query) || isNotEmptyArray(extraParts) || callbackUrl.includes('#')) {
                return yield* fail(EnableBankingCallbackFailureEnum.MALFORMED);
            }

            const parameters = yield* Effect.try({
                try: () =>
                    query.split('&').map(parameter => {
                        const separatorIndex = parameter.indexOf('=');
                        const name = separatorIndex === -1 ? parameter : parameter.slice(0, separatorIndex);
                        const value = separatorIndex === -1 ? '' : parameter.slice(separatorIndex + 1);

                        return [decodeURIComponent(name), decodeURIComponent(value)] as const;
                    }),
                catch: () => fail(EnableBankingCallbackFailureEnum.MALFORMED)
            });
            const valuesOf = (name: string) => parameters.filter(([parameterName]) => parameterName === name).map(([, value]) => value);
            const states = valuesOf('state');
            if (states.length !== 1 || states[0] !== pending.state) {
                return yield* fail(EnableBankingCallbackFailureEnum.STATE_MISMATCH);
            }

            if ((yield* Clock.currentTimeMillis) >= pending.expiresAtMs) {
                return yield* fail(EnableBankingCallbackFailureEnum.EXPIRED);
            }

            if (isNotEmptyArray(valuesOf('error'))) {
                return yield* fail(EnableBankingCallbackFailureEnum.CANCELLED);
            }

            const codes = valuesOf('code');
            const [code] = codes;
            if (codes.length !== 1 || !isNotEmptyString(code)) {
                return yield* fail(EnableBankingCallbackFailureEnum.MALFORMED);
            }

            return code;
        });

        const generateState = Db.query(db => db.all<{ readonly state: string }>(sql`SELECT lower(hex(randomblob(32))) AS state`)).pipe(
            Effect.orDie,
            Effect.flatMap(([row]) =>
                isDefined(row) && isNotEmptyString(row.state) ? Effect.succeed(row.state) : Effect.die(new Error('No random state'))
            )
        );

        const applyReconsent = Effect.fnUntraced(function* (
            integrationId: number,
            token: string,
            accounts: readonly SyncAccountInterface[]
        ) {
            const linkedAccounts = yield* accountRepository.findByIntegrationId(integrationId);
            const authorizedIds = new Set(accounts.map(account => account.id));
            if (isNotEmptyArray(linkedAccounts) && !linkedAccounts.some(account => authorizedIds.has(account.externalId ?? ''))) {
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
            yield* pollingSyncService.requestSync();
        });

        const isApplicationUsedByOtherIntegration = Effect.fnUntraced(function* (integrationId: number | null, applicationId: string) {
            const otherIntegrationIds = new Set(
                (yield* accountRepository.findByExternalSource(provider))
                    .map(account => account.integrationId)
                    .filter(isDefined)
                    .filter(otherIntegrationId => otherIntegrationId !== integrationId)
            );
            for (const otherIntegrationId of otherIntegrationIds) {
                const otherIntegration = yield* bankIntegrationRepository.findById(otherIntegrationId);
                const credentials = isDefined(otherIntegration)
                    ? yield* clientService.decodeCredentials(otherIntegration.token).pipe(Effect.orElseSucceed(() => null))
                    : null;
                if (credentials?.applicationId === applicationId) {
                    return true;
                }
            }

            return false;
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
            isApplicationInUse: (applicationId: string) => isApplicationUsedByOtherIntegration(null, applicationId),
            forgetCredentials: (applicationId: string) => clientService.forgetJwt(applicationId),
            validateCredentials: Effect.fn('EnableBankingSyncService.validateCredentials')(function* (applicationId: string) {
                yield* clientService.forgetJwt(applicationId);
                const application = yield* clientService.withClient(applicationId, client => client.getApplication());

                return { isActive: application.active, redirectUrls: application.redirect_urls };
            }),
            startAuthorization: Effect.fn('EnableBankingSyncService.startAuthorization')(function* (
                input: EnableBankingStartAuthorizationInputInterface
            ) {
                const nowMs = yield* Clock.currentTimeMillis;
                const state = yield* generateState;
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
            resolveCallbackCode: (pending: EnableBankingPendingAuthorizationInterface, callbackUrl: string) =>
                resolveCode(pending, callbackUrl),
            completeAuthorization: Effect.fn('EnableBankingSyncService.completeAuthorization')(function* (
                pending: EnableBankingPendingAuthorizationInterface,
                callbackUrl: string
            ) {
                const code = yield* resolveCode(pending, callbackUrl);
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
                    yield* applyReconsent(reconsentIntegrationId, token, accounts);
                }
                const unconnectableIds = yield* findUnconnectableExternalIds(accounts);

                return {
                    token,
                    integrationId: reconsentIntegrationId,
                    accounts,
                    previews: yield* pollingSyncService.mapAccountsToPreview(accounts, account => unconnectableIds.has(account.id))
                } satisfies EnableBankingAuthorizationResultInterface;
            }),
            setupAccountSyncBatch: Effect.fn('EnableBankingSyncService.setupAccountSyncBatch')(function* (
                token: string,
                accounts: SyncAccountInterface[],
                externalIds: readonly string[]
            ) {
                const unconnectableIds = yield* findUnconnectableExternalIds(accounts);
                const selectedAccounts = accounts.filter(account => externalIds.includes(account.id) && !unconnectableIds.has(account.id));
                for (const selectedAccount of selectedAccounts) {
                    const account = yield* pollingSyncService.getOrCreateSyncAccount(selectedAccount);
                    yield* createOrUpdateSync(account.id, token);
                }

                if (isNotEmptyArray(selectedAccounts)) {
                    const credentials = yield* clientService.decodeCredentials(token);
                    const integration = yield* syncIntegrationTokenService.getOrCreateIntegration(provider, token);
                    yield* syncIntegrationTokenService.fillIntegrationLabel(integration.id, credentials.aspspName);
                    yield* pollingSyncService.requestSync();
                }

                return selectedAccounts.length;
            }),
            disconnect: Effect.fn('EnableBankingSyncService.disconnect')(function* (integrationId: number) {
                const integration = yield* bankIntegrationRepository.findById(integrationId);
                if (!isDefined(integration)) {
                    return false;
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
                if (isDefined(credentials) && !(yield* isApplicationUsedByOtherIntegration(integrationId, credentials.applicationId))) {
                    yield* clientService.forgetJwt(credentials.applicationId);
                    yield* syncRequestSigner.deleteKey(credentials.applicationId);
                }

                for (const account of yield* accountRepository.findByIntegrationId(integrationId)) {
                    yield* accountArchiveService.archiveById(account.id);
                    yield* syncRepository.setEnabled(account.id, false);
                }
                yield* bankIntegrationRepository.deleteById(integrationId);

                return isSessionRevoked;
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
            EnableBankingClientService.layer
        ])
    );
}
