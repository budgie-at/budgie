import { HouseholdShareService, SyncOutboxRepository, SyncUploadService } from '@budgie/cloud-sync';
import {
    PERSONAL_SYNC_ZONE,
    HOUSEHOLD_SYNC_ZONE,
    AccountBalanceRepository,
    AccountTypeEnum,
    CurrencyEnum,
    ExternalSourceEnum,
    PRECISION,
    SettingsEntityTable,
    SyncRecordTypeEnum,
    SyncResetRepository,
    SyncZoneRoleEnum,
    UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    requireInstrument,
    seedLedgerBalance,
    TestLayer,
    startHousehold,
    shareDevices,
    shareAndUpload,
    onShareDevice
} from '../../harness';
import { testDb } from '../../harness/scenario/test-db';
import { seed } from '../../harness/seed/seed';

import type { AccountCreateEntityInterface } from '@budgie/contracts';

const OWN_BALANCE = 100 * PRECISION;
const FAMILY_BALANCE = 9970 * PRECISION;
const CURRENT_USER = '_current-user';
const OTHER_MEMBER = '_other-member';

type BankIdentity = Pick<AccountCreateEntityInterface, 'externalId' | 'externalSource'>;

const seedOwnAndFamilyAccounts = Effect.fnUntraced(function* (ownIdentity: BankIdentity = {}, familyIdentity: BankIdentity = {}) {
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const own = yield* seed.account({ instrumentId: euro.id, type: AccountTypeEnum.CASH, title: 'Own', ...ownIdentity });
    const family = yield* seed.account({ instrumentId: euro.id, type: AccountTypeEnum.CASH, title: 'Family', ...familyIdentity });

    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id, cloudUserRecordName: CURRENT_USER });
    yield* seedLedgerBalance(own.id, OWN_BALANCE);
    yield* seedLedgerBalance(family.id, FAMILY_BALANCE);
    yield* testDb.$client.unsafe('DELETE FROM sync_outbox');
    yield* testDb.$client.unsafe('UPDATE accounts SET sync_zone = ? WHERE id = ?', [HOUSEHOLD_SYNC_ZONE, family.id]);
    const [{ syncId }] = yield* testDb.$client.unsafe<{ readonly syncId: string }>('SELECT sync_id AS syncId FROM accounts WHERE id = ?', [
        family.id
    ]);

    return { euro, own, family, familySyncId: syncId };
});

const storeHouseholdRecord = (syncId: string, ownerId: string) =>
    testDb.$client.unsafe('INSERT OR REPLACE INTO sync_record (sync_zone, sync_id, record_type, payload) VALUES (?, ?, ?, ?)', [
        HOUSEHOLD_SYNC_ZONE,
        syncId,
        SyncRecordTypeEnum.ACCOUNT,
        JSON.stringify({ encryptedFields: { ownerId } })
    ]);

const isSharedByOther = (euroId: number, accountId: number) =>
    Effect.flatMap(AccountBalanceRepository, repository => repository.getHomeAccountRows(euroId)).pipe(
        Effect.map(rows => rows.find(row => row.account.id === accountId)?.isSharedByOther)
    );

const netWorth = (euroId: number) =>
    Effect.flatMap(AccountBalanceRepository, repository => repository.getNetWorth(euroId)).pipe(Effect.map(rows => rows.at(0)?.netWorth));

describe('net worth excludes accounts shared by other family members', () => {
    it.effect('leaves the household account of another member out of net worth and the liquid total', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { euro } = yield* seedOwnAndFamilyAccounts();

            expect((yield* accountBalanceRepository.getNetWorth(euro.id)).at(0)?.netWorth).toBe(OWN_BALANCE);
            expect((yield* accountBalanceRepository.getLiquidTotal(euro.id, false)).at(0)?.total).toBe(OWN_BALANCE);
        }).pipe(Effect.provide(TestLayer))
    );

    shareDevices('ownership survives reset', test => {
        test.effect('keeps an account shared by this user in net worth after resetting sync', () =>
            Effect.gen(function* () {
                const { clouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                const accountBalanceRepository = yield* AccountBalanceRepository;
                const { euro, family } = yield* seedOwnAndFamilyAccounts();
                yield* testDb.$client.unsafe("UPDATE accounts SET sync_zone = ?, title = 'Shared by me' WHERE id = ?", [
                    PERSONAL_SYNC_ZONE,
                    family.id
                ]);
                yield* shareAndUpload(testDb, clouds, family.id);
                expect((yield* accountBalanceRepository.getNetWorth(euro.id)).at(0)?.netWorth).toBe(OWN_BALANCE + FAMILY_BALANCE);
                yield* onShareDevice(
                    testDb,
                    Effect.gen(function* () {
                        yield* (yield* SyncResetRepository).clearSyncState();
                        yield* (yield* SyncOutboxRepository).enqueueAll(PERSONAL_SYNC_ZONE);
                    }).pipe(Effect.provide([SyncResetRepository.layer, SyncOutboxRepository.layer]))
                );
                expect((yield* accountBalanceRepository.getNetWorth(euro.id)).at(0)?.netWorth).toBe(OWN_BALANCE + FAMILY_BALANCE);
                expect(
                    (yield* accountBalanceRepository.getHomeAccountRows(euro.id)).find(row => row.account.id === family.id)?.isSharedByOther
                ).toBe(0);
            }).pipe(Effect.provide(TestLayer))
        );
    });

    it.effect('flags the account on the home rows', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { euro, own, family } = yield* seedOwnAndFamilyAccounts();
            const rows = yield* accountBalanceRepository.getHomeAccountRows(euro.id);
            const flagOf = (accountId: number) => rows.find(row => row.account.id === accountId)?.isSharedByOther;

            expect(flagOf(own.id)).toBe(0);
            expect(flagOf(family.id)).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('hides a stale household copy of my own bank account and counts only the personal account', () =>
        Effect.gen(function* () {
            const identity = { externalSource: ExternalSourceEnum.MONOBANK, externalId: 'mono-black-5535' };
            const { euro, family } = yield* seedOwnAndFamilyAccounts(identity, identity);
            const sharedByMe = yield* onShareDevice(
                testDb,
                Effect.flatMap(HouseholdShareService, service => service.findSharedAccountIds)
            );

            expect(yield* isSharedByOther(euro.id, family.id)).toBeUndefined();
            expect(yield* netWorth(euro.id)).toBe(OWN_BALANCE);
            expect((yield* (yield* AccountBalanceRepository).getLiquidTotal(euro.id, false)).at(0)?.total).toBe(OWN_BALANCE);
            expect(sharedByMe).not.toContain(family.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('treats a household account stamped with my owner id as mine', () =>
        Effect.gen(function* () {
            const { euro, family, familySyncId } = yield* seedOwnAndFamilyAccounts();

            yield* storeHouseholdRecord(familySyncId, CURRENT_USER);

            expect(yield* isSharedByOther(euro.id, family.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps another member account in the family section and out of net worth', () =>
        Effect.gen(function* () {
            const { euro, family, familySyncId } = yield* seedOwnAndFamilyAccounts(
                { externalSource: ExternalSourceEnum.MONOBANK, externalId: 'mono-mine' },
                { externalSource: ExternalSourceEnum.MONOBANK, externalId: 'mono-theirs' }
            );

            yield* storeHouseholdRecord(familySyncId, OTHER_MEMBER);

            expect(yield* isSharedByOther(euro.id, family.id)).toBe(1);
            expect(yield* netWorth(euro.id)).toBe(OWN_BALANCE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not match sentinel or shared-format external ids', () =>
        Effect.gen(function* () {
            const untracked = { externalId: UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID };
            const exchangeWallet = { externalSource: ExternalSourceEnum.BINANCE, externalId: 'spot:BTC' };
            const first = yield* seedOwnAndFamilyAccounts(untracked, untracked);

            expect(yield* isSharedByOther(first.euro.id, first.family.id)).toBe(1);

            const second = yield* seedOwnAndFamilyAccounts(exchangeWallet, exchangeWallet);

            expect(yield* isSharedByOther(second.euro.id, second.family.id)).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the original owner id when this device uploads an edit of another member account', () =>
        Effect.gen(function* () {
            const { familySyncId } = yield* seedOwnAndFamilyAccounts();

            yield* storeHouseholdRecord(familySyncId, OTHER_MEMBER);
            yield* testDb.$client.unsafe("UPDATE accounts SET title = 'Edited' WHERE sync_id = ?", [familySyncId]);
            const batch = yield* onShareDevice(
                testDb,
                Effect.flatMap(SyncUploadService, service => service.pending(100, new Set(), [HOUSEHOLD_SYNC_ZONE], null))
            );
            const record = batch.saves.flatMap(save => save.records).find(({ recordName }) => recordName === familySyncId);

            expect(record?.encryptedFields['ownerId']).toBe(OTHER_MEMBER);
        }).pipe(Effect.provide(TestLayer))
    );

    shareDevices('owner stamp', test => {
        test.effect('counts a shared own bank account exactly once', () =>
            Effect.gen(function* () {
                const { clouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                const { euro, family } = yield* seedOwnAndFamilyAccounts(
                    { externalSource: ExternalSourceEnum.MONOBANK, externalId: 'mono-white' },
                    { externalSource: ExternalSourceEnum.MONOBANK, externalId: 'mono-black' }
                );

                yield* testDb.$client.unsafe('UPDATE accounts SET sync_zone = ? WHERE id = ?', [PERSONAL_SYNC_ZONE, family.id]);
                yield* shareAndUpload(testDb, clouds, family.id);

                expect(yield* isSharedByOther(euro.id, family.id)).toBe(0);
                expect(yield* netWorth(euro.id)).toBe(OWN_BALANCE + FAMILY_BALANCE);
            }).pipe(Effect.provide(TestLayer))
        );

        test.effect('stamps a shared account with my owner id so it stays mine without the personal tombstone', () =>
            Effect.gen(function* () {
                const { clouds } = yield* startHousehold(SyncZoneRoleEnum.PARTICIPANT);
                const { euro, family, familySyncId } = yield* seedOwnAndFamilyAccounts();

                yield* testDb.$client.unsafe('UPDATE accounts SET sync_zone = ? WHERE id = ?', [PERSONAL_SYNC_ZONE, family.id]);
                yield* shareAndUpload(testDb, clouds, family.id);
                yield* testDb.$client.unsafe('DELETE FROM sync_record WHERE sync_zone = ? AND sync_id = ?', [
                    PERSONAL_SYNC_ZONE,
                    familySyncId
                ]);
                yield* testDb.$client.unsafe('DELETE FROM sync_outbox WHERE sync_zone = ?', [PERSONAL_SYNC_ZONE]);

                expect(yield* isSharedByOther(euro.id, family.id)).toBe(0);

                yield* testDb.update(SettingsEntityTable).set({ cloudUserRecordName: OTHER_MEMBER });

                expect(yield* isSharedByOther(euro.id, family.id)).toBe(1);
            }).pipe(Effect.provide(TestLayer))
        );
    });
});
