import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, instrumentRepository, syncRepository } from '../../@generic/drizzle/db/db';
import { accountService } from '../../account/service/account.service';
import { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';

import type { AccountEntityInterface, DB, LiabilityAccountCreateInputInterface } from '@budgie/contracts';
import type { SyncAccountInterface } from '@budgie/sync';

export abstract class AbstractSyncService {
    readonly supportsTokenAuth: boolean = false;

    protected abstract readonly provider: ExternalSourceEnum;

    protected abstract readonly providerTitle: string;

    protected abstract readonly accountType: AccountTypeEnum;

    updateAccountToken?(accountId: number, token: string): Promise<void>;

    @Log(
        (accountId, enabled) => `enter accountId=${accountId} enabled=${String(enabled)}`,
        (_result, accountId, enabled) => `done accountId=${accountId} enabled=${String(enabled)}`,
        (error, accountId, enabled) => `throw accountId=${accountId} enabled=${String(enabled)} error=${getErrorMessage(error)}`
    )
    async setAccountSyncEnabled(accountId: number, enabled: boolean): Promise<void> {
        await syncRepository.setEnabled(accountId, enabled);
    }

    @Log(
        (account, _tx) => `enter externalId=${account.id} currency=${account.currencyCode}`,
        (result, account, _tx) => `done externalId=${account.id} accountId=${result.id}`,
        (error, account, _tx) => `throw externalId=${account.id} error=${getErrorMessage(error)}`
    )
    protected async getOrCreateSyncAccount(account: SyncAccountInterface, tx?: DB): Promise<AccountEntityInterface> {
        const existingAccount = await this.findExistingSyncAccount(account);
        if (isDefined(existingAccount)) {
            return existingAccount;
        }

        const instruments = await instrumentRepository.getAll();
        const instrument = instruments.find(item => item.code === account.currencyCode);
        if (!isDefined(instrument)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error(`Instrument not found for currency: ${account.currencyCode}`);
        }

        const input = this.mapAccountToCreateInput(account, instrument.id);

        const [createdAccount] = Object.values(await accountService.bulkCreate([input], tx));
        if (!isDefined(createdAccount)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            throw new Error('Failed to create sync account');
        }

        return createdAccount;
    }

    @Log(
        (accounts, _isParked) => `enter externalIds=${accounts.map(account => account.id).join(',')}`,
        (result, _accounts, _isParked) =>
            `done externalIds=${result.map(preview => preview.externalId).join(',')} parkedCount=${result.filter(preview => preview.isParked).length}`,
        (error, accounts, _isParked) => `throw externalIds=${accounts.map(account => account.id).join(',')} error=${getErrorMessage(error)}`
    )
    protected async mapAccountsToPreview(
        accounts: SyncAccountInterface[],
        isParked: (account: SyncAccountInterface) => boolean = () => false
    ): Promise<SyncAccountPreviewInterface[]> {
        const existingAccounts = await accountRepository.findByExternalIds(accounts.map(account => account.id));
        const existingMap = new Map(existingAccounts.map(account => [account.externalId, account]));
        const existingSyncs = await syncRepository.getByProvider(this.provider);
        const syncedAccountIds = new Set(existingSyncs.map(sync => sync.accountId));

        return accounts.map(account => {
            const existingAccount = existingMap.get(account.id);

            return {
                externalId: account.id,
                title: this.generateAccountTitle(account),
                type: account.type,
                currencyCode: account.currencyCode,
                iban: account.iban ?? null,
                existingAccountId: existingAccount?.id ?? null,
                hasSync: isDefined(existingAccount) && syncedAccountIds.has(existingAccount.id),
                isParked: isParked(account)
            };
        });
    }

    protected generateAccountTitle(account: SyncAccountInterface): string {
        if (isNotEmptyArray(account.maskedPan)) {
            const lastFourDigits = account.maskedPan[0].slice(-4);

            return `${this.providerTitle} •${lastFourDigits}`;
        }

        return `${this.providerTitle} ${account.currencyCode}`;
    }

    protected accountIcon(_account: SyncAccountInterface): UserIconNameEnum {
        return UserIconNameEnum.Landmark;
    }

    protected mapAccountToCreateInput(account: SyncAccountInterface, instrumentId: number): LiabilityAccountCreateInputInterface {
        return {
            title: this.generateAccountTitle(account),
            type: this.accountType,
            icon: this.accountIcon(account),
            instrumentId,
            currentBalance: 0,
            externalId: account.id,
            externalSource: this.provider,
            iban: account.iban
        };
    }

    private async findExistingSyncAccount(account: SyncAccountInterface): Promise<AccountEntityInterface | null> {
        const existingByExternalId = await accountRepository.findByExternalIds([account.id]);
        if (isNotEmptyArray(existingByExternalId)) {
            return existingByExternalId[0];
        }

        if (isNotEmptyString(account.iban)) {
            const existingByIban = await accountRepository.findByIbans([account.iban]);
            if (isNotEmptyArray(existingByIban)) {
                return existingByIban[0];
            }
        }

        return null;
    }
}
