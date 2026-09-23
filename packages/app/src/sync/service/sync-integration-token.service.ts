/* oxlint-disable lingui/no-unlocalized-strings -- Internal error messages are developer-facing, not user-facing UI text */
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { accountRepository, bankIntegrationRepository, syncRepository } from '../../@generic/drizzle/db/db';

import type { AccountEntityInterface, BankIntegrationEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

class SyncIntegrationTokenService {
    @Log(
        (provider, accountId, token) => `enter provider=${provider} accountId=${accountId} tokenLen=${token.length}`,
        (_result, provider, accountId, token) => `done provider=${provider} accountId=${accountId} tokenLen=${token.length}`,
        (error, provider, accountId, token) =>
            `throw provider=${provider} accountId=${accountId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    async updateAccountToken(provider: ExternalSourceEnum, accountId: number, token: string): Promise<void> {
        const sync = await syncRepository.getByAccountId(accountId);
        if (!isDefined(sync)) {
            throw new Error('Sync not found');
        }

        const account = await accountRepository.findById(accountId);
        if (!isDefined(account)) {
            throw new Error('Account not found');
        }

        await this.applyAccountIntegrationToken(provider, account, token);
        await this.clearCredentialGroupErrors(provider, accountId);
    }

    @Log(
        (provider, accountId) => `enter provider=${provider} accountId=${accountId}`,
        (result, provider, accountId) => `done provider=${provider} accountId=${accountId} tokenLen=${result.length}`,
        (error, provider, accountId) => `throw provider=${provider} accountId=${accountId} error=${getErrorMessage(error)}`
    )
    async resolveAccountToken(provider: ExternalSourceEnum, accountId: number): Promise<string> {
        const account = await accountRepository.findById(accountId);
        if (!isDefined(account)) {
            throw new Error('Account not found');
        }

        return this.resolveIntegrationToken(provider, account);
    }

    @Log(
        (provider, account) => `enter provider=${provider} accountId=${account.id} integrationId=${account.integrationId}`,
        (result, provider, account) =>
            `done provider=${provider} accountId=${account.id} integrationId=${account.integrationId} tokenLen=${result.length}`,
        (error, provider, account) =>
            `throw provider=${provider} accountId=${account.id} integrationId=${account.integrationId} error=${getErrorMessage(error)}`
    )
    async resolveIntegrationToken(provider: ExternalSourceEnum, account: AccountEntityInterface): Promise<string> {
        if (!isDefined(account.integrationId)) {
            throw new Error(`Account has no linked ${provider} integration`);
        }

        const integration = await bankIntegrationRepository.findById(account.integrationId);
        if (!isDefined(integration)) {
            throw new Error('Bank integration not found');
        }

        return integration.token;
    }

    @Log(
        (provider, token) => `enter provider=${provider} tokenLen=${token.length}`,
        (result, provider, token) => `done provider=${provider} tokenLen=${token.length} integrationId=${result.id}`,
        (error, provider, token) => `throw provider=${provider} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    async getOrCreateIntegration(provider: ExternalSourceEnum, token: string): Promise<BankIntegrationEntityInterface> {
        const existingIntegration = await bankIntegrationRepository.findByProviderAndToken(provider, token);
        if (isDefined(existingIntegration)) {
            return existingIntegration;
        }

        return bankIntegrationRepository.create({ provider, token });
    }

    @Log(
        (provider, accountId) => `enter provider=${provider} accountId=${accountId}`,
        (_result, provider, accountId) => `done provider=${provider} accountId=${accountId}`,
        (error, provider, accountId) => `throw provider=${provider} accountId=${accountId} error=${getErrorMessage(error)}`
    )
    private async clearCredentialGroupErrors(provider: ExternalSourceEnum, accountId: number): Promise<void> {
        const providerSyncs = await syncRepository.getByProvider(provider);
        const accounts = await accountRepository.findByIds(providerSyncs.map(providerSync => providerSync.accountId));
        const integrationIdByAccountId = new Map(accounts.map(account => [account.id, account.integrationId]));
        const credentialGroupIntegrationId = integrationIdByAccountId.get(accountId);

        const groupSyncs = isDefined(credentialGroupIntegrationId)
            ? providerSyncs.filter(providerSync => integrationIdByAccountId.get(providerSync.accountId) === credentialGroupIntegrationId)
            : providerSyncs.filter(providerSync => providerSync.accountId === accountId);

        await Promise.all(groupSyncs.map(groupSync => syncRepository.update(groupSync.id, { errorCount: 0, lastError: null })));
    }

    @Log(
        (provider, integrationId, token) => `enter provider=${provider} integrationId=${integrationId} tokenLen=${token.length}`,
        (_result, provider, integrationId, token) => `done provider=${provider} integrationId=${integrationId} tokenLen=${token.length}`,
        (error, provider, integrationId, token) =>
            `throw provider=${provider} integrationId=${integrationId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async updateIntegrationToken(provider: ExternalSourceEnum, integrationId: number, token: string): Promise<void> {
        await bankIntegrationRepository.updateById(integrationId, { provider, token });
    }

    @Log(
        (provider, account, token) =>
            `enter provider=${provider} accountId=${account.id} integrationId=${account.integrationId} tokenLen=${token.length}`,
        (_result, provider, account, token) =>
            `done provider=${provider} accountId=${account.id} integrationId=${account.integrationId} tokenLen=${token.length}`,
        (error, provider, account, token) =>
            `throw provider=${provider} accountId=${account.id} integrationId=${account.integrationId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async applyAccountIntegrationToken(
        provider: ExternalSourceEnum,
        account: AccountEntityInterface,
        token: string
    ): Promise<void> {
        const existingIntegration = await bankIntegrationRepository.findByProviderAndToken(provider, token);
        if (isDefined(existingIntegration)) {
            if (existingIntegration.id !== account.integrationId) {
                await accountRepository.updateById(account.id, { integrationId: existingIntegration.id });
            }

            return;
        }

        if (isDefined(account.integrationId)) {
            await this.updateIntegrationToken(provider, account.integrationId, token);

            return;
        }

        const integration = await this.getOrCreateIntegration(provider, token);
        await accountRepository.updateById(account.id, { integrationId: integration.id });
    }
}

export const syncIntegrationTokenService = new SyncIntegrationTokenService();
