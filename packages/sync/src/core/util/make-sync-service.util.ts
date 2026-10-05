import { AccountRepository, Db, InstrumentRepository, SyncRepository } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { mapSyncAccountToCreateInput } from './map-sync-account-to-create-input.util';

import type { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncServiceDefinitionInterface } from '../interface/sync-service-definition.interface';

const IBAN_CHECK_DIGITS_START = 2;
const IBAN_CHECK_DIGITS_END = 4;
const IBAN_MIN_VALID_CHECK_DIGITS = 2;
const IBAN_MAX_VALID_CHECK_DIGITS = 98;

const resolveMatchableIban = (account: SyncAccountInterface): string | null => {
    if (!isNotEmptyString(account.iban)) {
        return null;
    }

    const checkDigits = Number(account.iban.slice(IBAN_CHECK_DIGITS_START, IBAN_CHECK_DIGITS_END));

    return checkDigits >= IBAN_MIN_VALID_CHECK_DIGITS && checkDigits <= IBAN_MAX_VALID_CHECK_DIGITS ? account.iban : null;
};

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

        const matchableIban = resolveMatchableIban(account);

        if (isDefined(matchableIban)) {
            const existingByIban = yield* accountRepository.findByIbans([matchableIban]);
            if (isNotEmptyArray(existingByIban)) {
                return existingByIban[0];
            }
        }

        return null;
    });

    return {
        setAccountSyncEnabled: Effect.fn('AbstractSyncService.setAccountSyncEnabled')(function* (accountId: number, enabled: boolean) {
            yield* Db.transaction(syncRepository.setEnabled(accountId, enabled));
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
                return yield* Effect.die(new Error(`Instrument not found for currency: ${account.currencyCode}`));
            }

            const [createdAccount] = Object.values(
                yield* accountService.bulkCreate([mapSyncAccountToCreateInput(definition, account, instrument.id)])
            );
            if (!isDefined(createdAccount)) {
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
            const existingByIban = yield* accountRepository.findByIbans(accounts.map(resolveMatchableIban).filter(isDefined));
            const existingByIbanMap = new Map(existingByIban.map(account => [account.iban, account]));
            const existingSyncs = yield* syncRepository.getByProvider(definition.provider);
            const syncedAccountIds = new Set(existingSyncs.map(sync => sync.accountId));

            return accounts.map((account): SyncAccountPreviewInterface => {
                const matchableIban = resolveMatchableIban(account);
                const existingAccount =
                    existingByExternalIdMap.get(account.id) ?? (isDefined(matchableIban) ? existingByIbanMap.get(matchableIban) : null);

                return {
                    externalId: account.id,
                    title: definition.generateAccountTitle(account),
                    type: account.type,
                    currencyCode: account.currencyCode,
                    iban: matchableIban,
                    existingAccountId: existingAccount?.id ?? null,
                    hasSync: isDefined(existingAccount) && syncedAccountIds.has(existingAccount.id),
                    isParked: isParked(account)
                };
            });
        })
    };
});
