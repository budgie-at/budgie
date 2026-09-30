import { AccountRepository, InstrumentRepository, SyncRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { AccountService } from '../../account/service/account.service';

import { mapSyncAccountToCreateInput } from './map-sync-account-to-create-input.util';

import type { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import type { SyncServiceDefinitionInterface } from '../interface/sync-service-definition.interface';
import type { SyncAccountInterface } from '@budgie/sync';

export const makeSyncService = Effect.fnUntraced(function* (definition: SyncServiceDefinitionInterface) {
    const accountRepository = yield* AccountRepository;
    const instrumentRepository = yield* InstrumentRepository;
    const syncRepository = yield* SyncRepository;
    const accountService = yield* AccountService;
    const afterSyncEnabledChange = definition.afterSyncEnabledChange ?? (() => Effect.void);

    const findExistingSyncAccount = Effect.fnUntraced(function* (account: SyncAccountInterface) {
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

    return {
        setAccountSyncEnabled: Effect.fn('AbstractSyncService.setAccountSyncEnabled')(function* (accountId: number, enabled: boolean) {
            yield* syncRepository.setEnabled(accountId, enabled);
            yield* afterSyncEnabledChange(enabled);
        }),
        getOrCreateSyncAccount: Effect.fn('AbstractSyncService.getOrCreateSyncAccount')(function* (account: SyncAccountInterface) {
            const existingAccount = yield* findExistingSyncAccount(account);
            if (isDefined(existingAccount)) {
                return existingAccount;
            }

            const instruments = yield* instrumentRepository.getAll();
            const instrument = instruments.find(item => item.code === account.currencyCode);
            if (!isDefined(instrument)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings
                return yield* Effect.die(new Error(`Instrument not found for currency: ${account.currencyCode}`));
            }

            const [createdAccount] = Object.values(
                yield* accountService.bulkCreate([mapSyncAccountToCreateInput(definition, account, instrument.id)])
            );
            if (!isDefined(createdAccount)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings
                return yield* Effect.die(new Error('Failed to create sync account'));
            }

            return createdAccount;
        }),
        mapAccountsToPreview: Effect.fn('AbstractSyncService.mapAccountsToPreview')(function* (
            accounts: SyncAccountInterface[],
            isParked: (account: SyncAccountInterface) => boolean = () => false
        ) {
            const existingByExternalId = yield* accountRepository.findByExternalIds(accounts.map(account => account.id));
            const existingByExternalIdMap = new Map(existingByExternalId.map(account => [account.externalId, account]));
            const existingByIban = yield* accountRepository.findByIbans(accounts.map(account => account.iban).filter(isNotEmptyString));
            const existingByIbanMap = new Map(existingByIban.map(account => [account.iban, account]));
            const existingSyncs = yield* syncRepository.getByProvider(definition.provider);
            const syncedAccountIds = new Set(existingSyncs.map(sync => sync.accountId));

            return accounts.map((account): SyncAccountPreviewInterface => {
                const existingAccount =
                    existingByExternalIdMap.get(account.id) ??
                    (isNotEmptyString(account.iban) ? existingByIbanMap.get(account.iban) : null);

                return {
                    externalId: account.id,
                    title: definition.generateAccountTitle(account),
                    type: account.type,
                    currencyCode: account.currencyCode,
                    iban: account.iban ?? null,
                    existingAccountId: existingAccount?.id ?? null,
                    hasSync: isDefined(existingAccount) && syncedAccountIds.has(existingAccount.id),
                    isParked: isParked(account)
                };
            });
        })
    };
});
