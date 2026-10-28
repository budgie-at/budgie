import { AccountRepository, BankIntegrationRepository, Db, SyncRepository, SyncStatusEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SyncTokenAlreadyConnectedError } from '../error/sync-token-already-connected.error';

import type { AccountEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export class SyncIntegrationTokenService extends Context.Service<SyncIntegrationTokenService>()(
    '@budgie/sync/SyncIntegrationTokenService',
    {
        make: Effect.gen(function* () {
            const accountRepository = yield* AccountRepository;
            const bankIntegrationRepository = yield* BankIntegrationRepository;
            const syncRepository = yield* SyncRepository;

            const resolveIntegrationToken = Effect.fn('SyncIntegrationTokenService.resolveIntegrationToken')(function* (
                provider: ExternalSourceEnum,
                account: AccountEntityInterface
            ) {
                if (!isDefined(account.integrationId)) {
                    return yield* Effect.die(new Error(`Account has no linked ${provider} integration`));
                }

                const integration = yield* bankIntegrationRepository.findById(account.integrationId);
                if (!isDefined(integration)) {
                    return yield* Effect.die(new Error('Bank integration not found'));
                }

                return integration.token;
            });

            const getOrCreateIntegration = Effect.fn('SyncIntegrationTokenService.getOrCreateIntegration')(function* (
                provider: ExternalSourceEnum,
                token: string
            ) {
                const existingIntegration = yield* bankIntegrationRepository.findByProviderAndToken(provider, token);
                if (isDefined(existingIntegration)) {
                    return existingIntegration;
                }

                return yield* bankIntegrationRepository.create({ provider, token });
            });

            const resetIntegrationSyncs = Effect.fnUntraced(function* (
                provider: ExternalSourceEnum,
                integrationId: number,
                shouldReenableFailedSyncs: boolean
            ) {
                const integrationAccountIds = new Set(
                    (yield* accountRepository.findByIntegrationId(integrationId)).map(account => account.id)
                );
                const integrationSyncs = (yield* syncRepository.getByProvider(provider)).filter(providerSync =>
                    integrationAccountIds.has(providerSync.accountId)
                );

                yield* Effect.forEach(
                    integrationSyncs,
                    integrationSync =>
                        syncRepository.update(integrationSync.id, {
                            errorCount: 0,
                            lastError: null,
                            ...(shouldReenableFailedSyncs &&
                                integrationSync.status === SyncStatusEnum.FAILED &&
                                !integrationSync.enabled && { enabled: true, status: SyncStatusEnum.IDLE })
                        }),
                    { concurrency: 'unbounded', discard: true }
                );
            });

            const ensureTokenAvailable = Effect.fn('SyncIntegrationTokenService.ensureTokenAvailable')(function* (
                provider: ExternalSourceEnum,
                token: string,
                ownIntegrationId: number | null
            ) {
                const existingIntegration = yield* bankIntegrationRepository.findByProviderAndToken(provider, token);
                if (isDefined(existingIntegration) && existingIntegration.id !== ownIntegrationId) {
                    return yield* new SyncTokenAlreadyConnectedError({
                        provider,
                        integrationId: existingIntegration.id,
                        message: `This ${provider} token is already connected`
                    });
                }
            });

            const applyAccountIntegrationToken = Effect.fnUntraced(function* (
                provider: ExternalSourceEnum,
                account: AccountEntityInterface,
                token: string
            ) {
                const existingIntegration = yield* bankIntegrationRepository.findByProviderAndToken(provider, token);
                if (isDefined(existingIntegration)) {
                    if (existingIntegration.id !== account.integrationId) {
                        yield* accountRepository.updateById(account.id, { integrationId: existingIntegration.id });
                    }

                    return existingIntegration.id;
                }

                if (isDefined(account.integrationId)) {
                    yield* bankIntegrationRepository.updateById(account.integrationId, { provider, token });

                    return account.integrationId;
                }

                const integration = yield* getOrCreateIntegration(provider, token);
                yield* accountRepository.updateById(account.id, { integrationId: integration.id });

                return integration.id;
            });

            return {
                resolveIntegrationToken,
                fillIntegrationLabel: Effect.fn('SyncIntegrationTokenService.fillIntegrationLabel')(function* (
                    integrationId: number,
                    label: string
                ) {
                    const integration = yield* bankIntegrationRepository.findById(integrationId);
                    if (isDefined(integration) && !isDefined(integration.label) && isNotEmptyString(label)) {
                        yield* bankIntegrationRepository.updateById(integrationId, { label });
                    }
                }),
                fillIntegrationClientId: Effect.fn('SyncIntegrationTokenService.fillIntegrationClientId')(function* (
                    integrationId: number,
                    externalClientId: string
                ) {
                    const integration = yield* bankIntegrationRepository.findById(integrationId);
                    if (isDefined(integration) && !isNotEmptyString(integration.externalClientId)) {
                        yield* bankIntegrationRepository.updateById(integrationId, { externalClientId });
                    }
                }),
                findIntegrationClientId: Effect.fn('SyncIntegrationTokenService.findIntegrationClientId')(function* (
                    integrationId: number
                ) {
                    return (yield* bankIntegrationRepository.findById(integrationId))?.externalClientId ?? null;
                }),
                findFiatHistoryFromAt: Effect.fn('SyncIntegrationTokenService.findFiatHistoryFromAt')(function* (integrationId: number) {
                    return (yield* bankIntegrationRepository.findById(integrationId))?.fiatHistoryFromAt ?? null;
                }),
                setFiatHistoryFromAt: (integrationId: number, fiatHistoryFromAt: Date) =>
                    bankIntegrationRepository.updateById(integrationId, { fiatHistoryFromAt }),
                findIntegrationByClientId: (provider: ExternalSourceEnum, externalClientId: string) =>
                    bankIntegrationRepository.findByProviderAndClientId(provider, externalClientId),
                getOrCreateIntegration,
                updateAccountToken: Effect.fn('SyncIntegrationTokenService.updateAccountToken')(function* (
                    provider: ExternalSourceEnum,
                    accountId: number,
                    token: string
                ) {
                    const sync = yield* syncRepository.getByAccountId(accountId);
                    if (!isDefined(sync)) {
                        return yield* Effect.die(new Error('Sync not found'));
                    }

                    const account = yield* accountRepository.findById(accountId);
                    if (!isDefined(account)) {
                        return yield* Effect.die(new Error('Account not found'));
                    }

                    const integrationId = yield* applyAccountIntegrationToken(provider, account, token);

                    return yield* resetIntegrationSyncs(provider, integrationId, false);
                }),
                ensureTokenAvailable,
                updateIntegrationToken: Effect.fn('SyncIntegrationTokenService.updateIntegrationToken')(
                    function* (integrationId: number, token: string) {
                        const integration = yield* bankIntegrationRepository.findById(integrationId);
                        if (!isDefined(integration)) {
                            return yield* Effect.die(new Error('Bank integration not found'));
                        }

                        yield* ensureTokenAvailable(integration.provider, token, integrationId);
                        yield* bankIntegrationRepository.updateById(integrationId, { token });

                        return yield* resetIntegrationSyncs(integration.provider, integrationId, true);
                    },
                    effect => Db.transaction(effect)
                ),
                resolveAccountToken: Effect.fn('SyncIntegrationTokenService.resolveAccountToken')(function* (
                    provider: ExternalSourceEnum,
                    accountId: number
                ) {
                    const account = yield* accountRepository.findById(accountId);
                    if (!isDefined(account)) {
                        return yield* Effect.die(new Error('Account not found'));
                    }

                    return yield* resolveIntegrationToken(provider, account);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(SyncIntegrationTokenService, SyncIntegrationTokenService.make).pipe(
        Layer.provide([AccountRepository.layer, BankIntegrationRepository.layer, SyncRepository.layer])
    );
}
