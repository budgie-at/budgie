/* oxlint-disable lingui/no-unlocalized-strings -- Internal error messages are developer-facing, not user-facing UI text */
import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { accountRepository, bankIntegrationRepository, syncRepository } from '../../@generic/drizzle/db/db';

import type { AccountEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

class SyncIntegrationTokenService {
    readonly updateAccountToken = Effect.fn('SyncIntegrationTokenService.updateAccountToken')(function* (
        this: SyncIntegrationTokenService,
        provider: ExternalSourceEnum,
        accountId: number,
        token: string
    ) {
        const sync = yield* syncRepository.getByAccountId(accountId);
        if (!isDefined(sync)) {
            return yield* Effect.die(new Error('Sync not found'));
        }

        const account = yield* Db.query(db => accountRepository.findById(accountId, db));
        if (!isDefined(account)) {
            return yield* Effect.die(new Error('Account not found'));
        }

        yield* this.applyAccountIntegrationToken(provider, account, token);

        return yield* this.clearCredentialGroupErrors(provider, accountId);
    });

    readonly resolveAccountToken = Effect.fn('SyncIntegrationTokenService.resolveAccountToken')(function* (
        this: SyncIntegrationTokenService,
        provider: ExternalSourceEnum,
        accountId: number
    ) {
        const account = yield* Db.query(db => accountRepository.findById(accountId, db));
        if (!isDefined(account)) {
            return yield* Effect.die(new Error('Account not found'));
        }

        return yield* this.resolveIntegrationToken(provider, account);
    });

    readonly resolveIntegrationToken = Effect.fn('SyncIntegrationTokenService.resolveIntegrationToken')(function* (
        provider: ExternalSourceEnum,
        account: AccountEntityInterface
    ) {
        if (!isDefined(account.integrationId)) {
            return yield* Effect.die(new Error(`Account has no linked ${provider} integration`));
        }

        const { integrationId } = account;
        const integration = yield* Db.query(() => bankIntegrationRepository.findById(integrationId));
        if (!isDefined(integration)) {
            return yield* Effect.die(new Error('Bank integration not found'));
        }

        return integration.token;
    });

    readonly getOrCreateIntegration = Effect.fn('SyncIntegrationTokenService.getOrCreateIntegration')(function* (
        provider: ExternalSourceEnum,
        token: string
    ) {
        const existingIntegration = yield* bankIntegrationRepository.findByProviderAndToken(provider, token);
        if (isDefined(existingIntegration)) {
            return existingIntegration;
        }

        return yield* bankIntegrationRepository.create({ provider, token });
    });

    private readonly clearCredentialGroupErrors = Effect.fnUntraced(function* (provider: ExternalSourceEnum, accountId: number) {
        const providerSyncs = yield* syncRepository.getByProvider(provider);
        const accounts = yield* accountRepository.findByIds(providerSyncs.map(providerSync => providerSync.accountId));
        const integrationIdByAccountId = new Map(accounts.map(account => [account.id, account.integrationId]));
        const credentialGroupIntegrationId = integrationIdByAccountId.get(accountId);

        const groupSyncs = isDefined(credentialGroupIntegrationId)
            ? providerSyncs.filter(providerSync => integrationIdByAccountId.get(providerSync.accountId) === credentialGroupIntegrationId)
            : providerSyncs.filter(providerSync => providerSync.accountId === accountId);

        yield* Effect.all(
            groupSyncs.map(groupSync => syncRepository.update(groupSync.id, { errorCount: 0, lastError: null })),
            { concurrency: 'unbounded' }
        );
    });

    private readonly applyAccountIntegrationToken = Effect.fnUntraced(function* (
        this: SyncIntegrationTokenService,
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

        const integration = yield* this.getOrCreateIntegration(provider, token);
        yield* accountRepository.updateById(account.id, { integrationId: integration.id });
    });
}

export const syncIntegrationTokenService = new SyncIntegrationTokenService();
