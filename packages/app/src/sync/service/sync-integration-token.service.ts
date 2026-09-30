/* oxlint-disable lingui/no-unlocalized-strings -- Internal error messages are developer-facing, not user-facing UI text */
import { AccountRepository, BankIntegrationRepository, SyncRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { AccountEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export class SyncIntegrationTokenService extends Context.Service<SyncIntegrationTokenService>()('@budgie/app/SyncIntegrationTokenService', {
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

        const clearCredentialGroupErrors = Effect.fnUntraced(function* (provider: ExternalSourceEnum, accountId: number) {
            const providerSyncs = yield* syncRepository.getByProvider(provider);
            const accounts = yield* accountRepository.findByIds(providerSyncs.map(providerSync => providerSync.accountId));
            const integrationIdByAccountId = new Map(accounts.map(account => [account.id, account.integrationId]));
            const credentialGroupIntegrationId = integrationIdByAccountId.get(accountId);

            const groupSyncs = isDefined(credentialGroupIntegrationId)
                ? providerSyncs.filter(
                      providerSync => integrationIdByAccountId.get(providerSync.accountId) === credentialGroupIntegrationId
                  )
                : providerSyncs.filter(providerSync => providerSync.accountId === accountId);

            yield* Effect.all(
                groupSyncs.map(groupSync => syncRepository.update(groupSync.id, { errorCount: 0, lastError: null })),
                { concurrency: 'unbounded' }
            );
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

                return;
            }

            if (isDefined(account.integrationId)) {
                yield* bankIntegrationRepository.updateById(account.integrationId, { provider, token });

                return;
            }

            const integration = yield* getOrCreateIntegration(provider, token);
            yield* accountRepository.updateById(account.id, { integrationId: integration.id });
        });

        return {
            resolveIntegrationToken,
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

                yield* applyAccountIntegrationToken(provider, account, token);

                return yield* clearCredentialGroupErrors(provider, accountId);
            }),
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
}) {
    static readonly layer = Layer.effect(SyncIntegrationTokenService, SyncIntegrationTokenService.make).pipe(
        Layer.provide([AccountRepository.layer, BankIntegrationRepository.layer, SyncRepository.layer])
    );
}
