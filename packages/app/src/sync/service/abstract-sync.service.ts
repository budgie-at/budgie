import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { accountRepository, bankSyncRepository } from '../../@generic/drizzle/db/db';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import { generateBankAccountTitle } from '../util/map-bank-account-to-create-input.util';

import type { BankAccountInterface } from '@budgie/bank-sync';

export abstract class AbstractSyncService {
    readonly supportsTokenAuth: boolean = false;

    protected abstract readonly provider: ExternalSourceEnum;

    updateAccountToken?(accountId: number, token: string): Promise<void>;

    @Log(
        (accountId, enabled) => `enter accountId=${accountId} enabled=${String(enabled)}`,
        (_result, accountId, enabled) => `done accountId=${accountId} enabled=${String(enabled)}`,
        (error, accountId, enabled) => `throw accountId=${accountId} enabled=${String(enabled)} error=${getErrorMessage(error)}`
    )
    async setAccountSyncEnabled(accountId: number, enabled: boolean): Promise<void> {
        await bankSyncRepository.setEnabled(accountId, enabled);
    }

    @Log(
        (bankAccounts, _isParked) => `enter externalIds=${bankAccounts.map(account => account.id).join(',')}`,
        (result, _bankAccounts, _isParked) =>
            `done externalIds=${result.map(preview => preview.externalId).join(',')} parkedCount=${result.filter(preview => preview.isParked).length}`,
        (error, bankAccounts, _isParked) =>
            `throw externalIds=${bankAccounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    protected async mapAccountsToPreview(
        bankAccounts: BankAccountInterface[],
        isParked: (bankAccount: BankAccountInterface) => boolean = () => false
    ): Promise<SyncAccountPreviewInterface[]> {
        const existingAccounts = await accountRepository.findByExternalIds(bankAccounts.map(account => account.id));
        const existingMap = new Map(existingAccounts.map(account => [account.externalId, account]));
        const existingSyncs = await bankSyncRepository.getByProvider(this.provider);
        const syncedAccountIds = new Set(existingSyncs.map(sync => sync.accountId));

        return bankAccounts.map(bankAccount => {
            const existingAccount = existingMap.get(bankAccount.id);

            return {
                externalId: bankAccount.id,
                title: generateBankAccountTitle(bankAccount),
                type: bankAccount.type,
                currencyCode: bankAccount.currencyCode,
                iban: bankAccount.iban ?? null,
                existingAccountId: existingAccount?.id ?? null,
                hasBankSync: isDefined(existingAccount) && syncedAccountIds.has(existingAccount.id),
                isParked: isParked(bankAccount)
            };
        });
    }
}
