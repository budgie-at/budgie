/* oxlint-disable lingui/no-unlocalized-strings -- Internal error messages are developer-facing, not user-facing UI text */
import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { accountRepository, bankIntegrationRepository, bankSyncRepository } from '../../@generic/drizzle/db/db';

import type { AccountEntityInterface, BankIntegrationEntityInterface } from '@budgie/contracts';

class MonobankIntegrationTokenService {
    private readonly provider = ExternalSourceEnum.MONOBANK;

    @Log(
        (accountId, token) => `enter accountId=${accountId} tokenLen=${token.length}`,
        (_result, accountId, token) => `done accountId=${accountId} tokenLen=${token.length}`,
        (error, accountId, token) => `throw accountId=${accountId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    async updateAccountToken(accountId: number, token: string): Promise<void> {
        const bankSync = await bankSyncRepository.getByAccountId(accountId);
        if (!isDefined(bankSync)) {
            throw new Error('Bank sync not found');
        }

        const account = await accountRepository.findById(accountId);
        if (!isDefined(account)) {
            throw new Error('Account not found');
        }

        await this.applyAccountIntegrationToken(account, token);

        await bankSyncRepository.update(bankSync.id, { errorCount: 0, lastError: null });
    }

    @Log(
        account => `enter accountId=${account.id} integrationId=${account.integrationId}`,
        (result, account) => `done accountId=${account.id} integrationId=${account.integrationId} tokenLen=${result.length}`,
        (error, account) => `throw accountId=${account.id} integrationId=${account.integrationId} error=${getErrorMessage(error)}`
    )
    async resolveIntegrationToken(account: AccountEntityInterface): Promise<string> {
        if (!isDefined(account.integrationId)) {
            throw new Error('Account has no linked bank integration');
        }

        const integration = await bankIntegrationRepository.findById(account.integrationId);
        if (!isDefined(integration)) {
            throw new Error('Bank integration not found');
        }

        return integration.token;
    }

    @Log(
        token => `enter tokenLen=${token.length}`,
        (result, token) => `done tokenLen=${token.length} integrationId=${result.id}`,
        (error, token) => `throw tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    async getOrCreateIntegration(token: string): Promise<BankIntegrationEntityInterface> {
        const existingIntegration = await bankIntegrationRepository.findByProviderAndToken(this.provider, token);
        if (isDefined(existingIntegration)) {
            return existingIntegration;
        }

        return bankIntegrationRepository.create({ provider: this.provider, token });
    }

    @Log(
        (integrationId, token) => `enter integrationId=${integrationId} tokenLen=${token.length}`,
        (_result, integrationId, token) => `done integrationId=${integrationId} tokenLen=${token.length}`,
        (error, integrationId, token) => `throw integrationId=${integrationId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async updateIntegrationToken(integrationId: number, token: string): Promise<void> {
        await bankIntegrationRepository.updateById(integrationId, { token });
    }

    @Log(
        (account, token) => `enter accountId=${account.id} integrationId=${account.integrationId} tokenLen=${token.length}`,
        (_result, account, token) => `done accountId=${account.id} integrationId=${account.integrationId} tokenLen=${token.length}`,
        (error, account, token) =>
            `throw accountId=${account.id} integrationId=${account.integrationId} tokenLen=${token.length} error=${getErrorMessage(error)}`
    )
    private async applyAccountIntegrationToken(account: AccountEntityInterface, token: string): Promise<void> {
        const existingIntegration = await bankIntegrationRepository.findByProviderAndToken(this.provider, token);
        if (isDefined(existingIntegration)) {
            if (existingIntegration.id !== account.integrationId) {
                await accountRepository.updateById(account.id, { integrationId: existingIntegration.id });
            }

            return;
        }

        if (isDefined(account.integrationId)) {
            await this.updateIntegrationToken(account.integrationId, token);

            return;
        }

        const integration = await this.getOrCreateIntegration(token);
        await accountRepository.updateById(account.id, { integrationId: integration.id });
    }
}

export const monobankIntegrationTokenService = new MonobankIntegrationTokenService();
