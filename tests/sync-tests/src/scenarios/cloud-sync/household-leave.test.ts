import { appAtomRegistry } from '@app/@generic/constant/app-atom-registry.constant';
import { householdStateAtom } from '@app/household/constant/household-state-atom.constant';
import { makeTestDbLayer, resetTestDb, TestSeedService } from '@budgie-at/test-kit';
import { CloudSyncService, HouseholdRoleEnum } from '@budgie/cloud-sync';
import { Db, HOUSEHOLD_SYNC_ZONE, PERSONAL_SYNC_ZONE, SyncZoneRegistryRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { FakeCloudTransport, testDb } from '../../harness';

import { expectBalancesMatchLedger, pullDevice, refreshAllBalances } from './apply-harness';
import {
    countRows,
    MEMBER_ACCOUNT,
    MEMBER_DEVICE,
    OWNER_ACCOUNT,
    pushHouseholdZone,
    readPersonalBalances,
    readSyncIds,
    seedHouseholdLedger,
    seedPersonalLedger,
    shareAcceptedEvent
} from './household-harness';
import { makeSyncServiceContext } from './sync-service-harness';

describe('cloud-sync/household leave', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('member leaves', it => {
        it.effect('keeps a personal copy with fresh ids and correct balances, and later owner edits no longer arrive', () =>
            Effect.gen(function* () {
                const memberDb = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(memberDb);

                const { account: ownerAccount } = yield* seedHouseholdLedger(testDb);

                yield* seedPersonalLedger(memberDb, 'Member card', 4_000_000);
                yield* pushHouseholdZone(testDb, cloud);
                cloud.shareZone(HOUSEHOLD_SYNC_ZONE, [OWNER_ACCOUNT]);
                cloud.acceptShare(HOUSEHOLD_SYNC_ZONE, MEMBER_ACCOUNT);
                yield* pullDevice(memberDb, cloud, MEMBER_DEVICE, { accountId: MEMBER_ACCOUNT });

                const ownerSyncIds = yield* readSyncIds(testDb, 'accounts', HOUSEHOLD_SYNC_ZONE);
                const [{ amount: ownerBalance }] = yield* testDb.$client.unsafe<{ readonly amount: number }>(
                    'SELECT amount FROM account_balances WHERE account_id = ?',
                    [ownerAccount.id]
                );
                const personalBefore = yield* readPersonalBalances(memberDb);

                expect(yield* countRows(memberDb, 'accounts', HOUSEHOLD_SYNC_ZONE)).toBe(1);
                expect(yield* countRows(memberDb, 'transactions', HOUSEHOLD_SYNC_ZONE)).toBe(1);

                const member = makeSyncServiceContext(memberDb);

                yield* member.run(
                    Effect.gen(function* () {
                        const service = yield* CloudSyncService;
                        const registry = yield* SyncZoneRegistryRepository;

                        yield* service.reconfigure;
                        yield* service.handleShareAccepted(shareAcceptedEvent());
                        yield* service.leaveHousehold();

                        expect(yield* registry.findByLabel(HOUSEHOLD_SYNC_ZONE)).toBeUndefined();
                    })
                );

                expect(member.transport.calls.leftShares).toEqual(['Household']);
                expect(member.transport.calls.sharedStopped).toBe(1);
                expect(appAtomRegistry.get(householdStateAtom).role).toBe(HouseholdRoleEnum.NONE);

                for (const tableName of ['accounts', 'transactions', 'transaction_entries']) {
                    expect(yield* countRows(memberDb, tableName, HOUSEHOLD_SYNC_ZONE)).toBe(0);
                }

                const personalSyncIds = yield* readSyncIds(memberDb, 'accounts', PERSONAL_SYNC_ZONE);

                expect(personalSyncIds).toHaveLength(2);
                expect(personalSyncIds.filter(syncId => ownerSyncIds.includes(syncId))).toEqual([]);

                const personalAfter = yield* readPersonalBalances(memberDb);

                expect(personalAfter.filter(({ title }) => title !== 'Household joint')).toEqual(personalBefore);
                expect(personalAfter.find(({ title }) => title === 'Household joint')?.amount).toBe(ownerBalance);
                yield* expectBalancesMatchLedger(memberDb);

                const queuedAccounts = yield* memberDb.$client.unsafe<{ readonly total: number }>(
                    `SELECT COUNT(*) AS total FROM sync_outbox WHERE sync_zone = 'personal' AND record_type = 'Account'`
                );

                expect(queuedAccounts[0].total).toBe(2);

                cloud.revokeShare(HOUSEHOLD_SYNC_ZONE, MEMBER_ACCOUNT);

                const seed = new TestSeedService(testDb);

                const later = yield* seed.manualExpense({
                    accountId: ownerAccount.id,
                    amount: 3_000_000,
                    operatedAt: new Date('2026-10-03T10:00:00Z'),
                    title: 'Later edit'
                });

                yield* testDb.$client.unsafe('UPDATE transactions SET sync_zone = ? WHERE id = ?', [HOUSEHOLD_SYNC_ZONE, later.id]);
                yield* testDb.$client.unsafe('UPDATE transaction_entries SET sync_zone = ? WHERE transaction_id = ?', [
                    HOUSEHOLD_SYNC_ZONE,
                    later.id
                ]);
                yield* refreshAllBalances(testDb);
                yield* pushHouseholdZone(testDb, cloud);

                const delivered = yield* pullDevice(memberDb, cloud, MEMBER_DEVICE, { accountId: MEMBER_ACCOUNT });

                expect(delivered).toEqual([]);
                expect(yield* countRows(memberDb, 'transactions')).toBe(2);
            })
        );
    });
});
