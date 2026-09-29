import { AccountTypeEnum, ExternalSourceEnum, UserIconNameEnum, normalizeAccountIban } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { accountRepository, instrumentRepository, syncRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { accountService } from '../../account/service/account.service';

import type { Workload } from '../../@generic/service/workload.service';
import type { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import type { Db, LiabilityAccountCreateInputInterface } from '@budgie/contracts';
import type { SyncAccountInterface } from '@budgie/sync';
import type * as HttpClient from 'effect/http/HttpClient';

export abstract class AbstractSyncService {
    readonly supportsTokenAuth: boolean = false;

    readonly supportsFileImport: boolean = false;

    readonly supportsAddAccounts: boolean = false;

    readonly setAccountSyncEnabled = Effect.fn('AbstractSyncService.setAccountSyncEnabled')(function* (
        this: AbstractSyncService,
        accountId: number,
        enabled: boolean
    ) {
        yield* syncRepository.setEnabled(accountId, enabled);
        yield* this.afterSyncEnabledChange(enabled);
    }, invalidateDatabaseLiveQuery);

    protected readonly getOrCreateSyncAccount = Effect.fn('AbstractSyncService.getOrCreateSyncAccount')(function* (
        this: AbstractSyncService,
        account: SyncAccountInterface
    ) {
        const existingAccount = yield* this.findExistingSyncAccount(account);
        if (isDefined(existingAccount)) {
            return existingAccount;
        }

        const instruments = yield* instrumentRepository.getAll();
        const instrument = instruments.find(item => item.code === account.currencyCode);
        if (!isDefined(instrument)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            return yield* Effect.die(new Error(`Instrument not found for currency: ${account.currencyCode}`));
        }

        const [createdAccount] = Object.values(yield* accountService.bulkCreate([this.mapAccountToCreateInput(account, instrument.id)]));
        if (!isDefined(createdAccount)) {
            // eslint-disable-next-line lingui/no-unlocalized-strings
            return yield* Effect.die(new Error('Failed to create sync account'));
        }

        return createdAccount;
    });

    protected readonly mapAccountsToPreview = Effect.fn('AbstractSyncService.mapAccountsToPreview')(function* (
        this: AbstractSyncService,
        accounts: SyncAccountInterface[],
        isParked: (account: SyncAccountInterface) => boolean = () => false
    ) {
        const existingByExternalId = yield* accountRepository.findByExternalIds(accounts.map(account => account.id));
        const existingByExternalIdMap = new Map(existingByExternalId.map(account => [account.externalId, account]));
        const existingByIban = yield* accountRepository.findByIbans(accounts.map(account => account.iban).filter(isNotEmptyString));
        const existingByIbanMap = new Map(existingByIban.map(account => [account.iban, account]));
        const existingSyncs = yield* syncRepository.getByProvider(this.provider);
        const syncedAccountIds = new Set(existingSyncs.map(sync => sync.accountId));

        return accounts.map((account): SyncAccountPreviewInterface => {
            const existingAccount =
                existingByExternalIdMap.get(account.id) ?? (isNotEmptyString(account.iban) ? existingByIbanMap.get(account.iban) : null);

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
    });

    private readonly findExistingSyncAccount = Effect.fnUntraced(function* (account: SyncAccountInterface) {
        const existingByExternalId = yield* accountRepository.findByExternalIds([account.id]);
        if (isNotEmptyArray(existingByExternalId)) {
            return existingByExternalId[0];
        }

        if (isNotEmptyString(account.iban)) {
            const existingByIban = yield* accountRepository.findByIbans([account.iban]);
            if (isNotEmptyArray(existingByIban)) {
                return existingByIban[0];
            }
        }

        return null;
    });

    protected abstract readonly provider: ExternalSourceEnum;

    protected abstract readonly providerTitle: string;

    protected abstract readonly accountType: AccountTypeEnum;

    protected afterSyncEnabledChange(_enabled: boolean): Effect.Effect<void, never, Db | HttpClient.HttpClient | Workload> {
        return Effect.void;
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
            iban: normalizeAccountIban(account.iban)
        };
    }
}
