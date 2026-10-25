import { AccountRepository, Db, InstrumentRepository, SyncRepository } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { mapSyncAccountToCreateInput } from './map-sync-account-to-create-input.util';

import type { SyncAccountPreviewInterface } from '../interface/sync-account-preview.interface';
import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncServiceDefinitionInterface } from '../interface/sync-service-definition.interface';
import type { AccountEntityInterface } from '@budgie/contracts';
import type * as HttpClient from 'effect/http/HttpClient';

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

export const makeSyncService = Effect.fnUntraced(function* (
    definition: SyncServiceDefinitionInterface,
    afterSyncEnabledChange: (enabled: boolean) => Effect.Effect<void, never, Db | HttpClient.HttpClient> = () => Effect.void
) {
    const accountRepository = yield* AccountRepository;
    const instrumentRepository = yield* InstrumentRepository;
    const syncRepository = yield* SyncRepository;
    const accountService = yield* AccountService;

    const findAccountsByExternalId = Effect.fnUntraced(function* (externalIds: string[]) {
        const [accounts, aliases] = yield* Effect.all([
            accountRepository.findByExternalIds(externalIds),
            accountRepository.findExternalIdAliases(externalIds)
        ]);

        return new Map([
            ...aliases.filter(alias => !isDefined(alias.account.deletedAt)).map(alias => [alias.externalId, alias.account] as const),
            ...accounts.map(account => [account.externalId, account] as const)
        ]);
    });

    const excludeMatchingAccounts = (
        accounts: SyncAccountInterface[],
        matchedAccounts: Pick<AccountEntityInterface, 'externalId' | 'iban'>[],
        matchedExternalIds: string[]
    ) => {
        const matchedKeys = new Set([
            ...matchedAccounts.flatMap(account => [account.externalId, account.iban]).filter(isDefined),
            ...matchedExternalIds
        ]);

        return accounts.filter(account => ![account.id, resolveMatchableIban(account)].some(key => isDefined(key) && matchedKeys.has(key)));
    };

    const findExistingSyncAccount = Effect.fnUntraced(function* (account: SyncAccountInterface) {
        const existingByExternalId = (yield* findAccountsByExternalId([account.id])).get(account.id);
        if (isDefined(existingByExternalId)) {
            return existingByExternalId;
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
        findAccountsByExternalId,
        excludeExternalAccounts: Effect.fn('AbstractSyncService.excludeExternalAccounts')(function* (accounts: SyncAccountInterface[]) {
            const externalAccounts = yield* accountRepository.findExternal();
            const aliases = yield* accountRepository.findExternalIdAliases(accounts.map(account => account.id));

            return excludeMatchingAccounts(
                accounts,
                externalAccounts,
                aliases.filter(alias => alias.account.isExternal).map(alias => alias.externalId)
            );
        }),
        excludeKnownAccounts: Effect.fn('AbstractSyncService.excludeKnownAccounts')(function* (accounts: SyncAccountInterface[]) {
            const knownAccounts = yield* accountRepository.findIncludingArchivedByExternalKeys(
                accounts.flatMap(account => [account.id, resolveMatchableIban(account)]).filter(isDefined)
            );
            const aliases = yield* accountRepository.findExternalIdAliases(accounts.map(account => account.id));

            return excludeMatchingAccounts(
                accounts,
                knownAccounts,
                aliases.map(alias => alias.externalId)
            );
        }),
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
            const existingByExternalIdMap = yield* findAccountsByExternalId(accounts.map(account => account.id));
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
