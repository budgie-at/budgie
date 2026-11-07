import { TestSeedService } from '@budgie-at/test-kit';
import { SyncAutomationService, HouseholdShareService } from '@budgie/cloud-sync';
import { UnconsolidationService } from '@budgie/consolidation';
import { Db, ExternalSourceEnum, SyncZoneRoleEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/test-db';

import { readOutboxRows, refreshAllBalances, uploadDevice } from './apply-harness';
import { onAutomatedDevice } from './automation-harness';
import { FakeCloudTransport } from './fake-cloud-transport';
import { HOUSEHOLD_ZONE, onShareDevice, prepareHousehold, pullZones, queryRows, reconcileDevice } from './share-harness';

import type { ShareCloudsInterface } from './share-harness';
import type { DB } from '@budgie/contracts';

export const TRANSFER_AMOUNT = 5_000_000;
export const ALICE_IBAN = 'UA-ALICE-X';
export const BOB_IBAN = 'UA-BOB-Y';
export const EXPENSE_AT = new Date('2026-10-06T10:00:00Z');
export const INCOME_AT = new Date('2026-10-06T10:01:00Z');
export const PRIVATE_TITLE = 'secret rent';
export const PRIVATE_COMMENT = 'private memo';
export const PRIVATE_ACCOUNT_TITLE = 'Alice private';

const MAX_ROUNDS = 6;
const ALICE_DEVICE = 'alice-device';
const BOB_DEVICE = 'bob-device';

export interface MemberCloudsInterface {
    readonly alice: ShareCloudsInterface;
    readonly bob: ShareCloudsInterface;
}

export interface VisibleTransactionInterface {
    readonly syncId: string;
    readonly type: string;
    readonly consolidationType: string | null;
    readonly entryCount: number;
}

const makeMemberClouds = (): MemberCloudsInterface => {
    const household = new FakeCloudTransport();

    return {
        alice: { personal: new FakeCloudTransport(), household },
        bob: { personal: new FakeCloudTransport(), household }
    };
};

const syncDevice = (database: DB, clouds: ShareCloudsInterface, deviceId: string, isAutomated: boolean) =>
    Effect.gen(function* () {
        yield* reconcileDevice(database);
        const uploaded = yield* uploadDevice(database, clouds);

        const results = yield* pullZones(database, clouds.household, deviceId, [HOUSEHOLD_ZONE]);

        if (isAutomated) {
            for (const result of results) {
                yield* onAutomatedDevice(
                    database,
                    Effect.flatMap(SyncAutomationService, service => service.afterApply(result))
                );
            }
        }

        return {
            rejected: results.flatMap(result => result.rejected),
            isActive: results.length > 0 || uploaded.saves.length > 0 || uploaded.deletions.length > 0
        };
    });

export const settleMembers = (bobDatabase: DB, clouds: MemberCloudsInterface, isAutomated = true) =>
    Effect.gen(function* () {
        const rejected: unknown[] = [];

        for (let round = 1; round <= MAX_ROUNDS; round += 1) {
            const aliceRound = yield* syncDevice(testDb, clouds.alice, ALICE_DEVICE, isAutomated);
            const bobRound = yield* syncDevice(bobDatabase, clouds.bob, BOB_DEVICE, isAutomated);

            rejected.push(...aliceRound.rejected, ...bobRound.rejected);

            const sizes = [(yield* readOutboxRows(testDb)).length, (yield* readOutboxRows(bobDatabase)).length];

            if (sizes.every(size => size === 0) && !aliceRound.isActive && !bobRound.isActive) {
                return { rounds: round, rejected };
            }
        }

        return { rounds: MAX_ROUNDS + 1, rejected };
    });

const shareAccountOn = (database: DB, accountId: number) =>
    onShareDevice(
        database,
        Effect.flatMap(HouseholdShareService, service => service.shareAccount(accountId))
    );

export const visibleTransactions = (database: DB) =>
    queryRows<VisibleTransactionInterface>(
        database,
        `SELECT t.sync_id AS syncId, t.type AS type, t.consolidation_type AS consolidationType,
            (SELECT COUNT(*) FROM transaction_entries e WHERE e.transaction_id = t.id AND e.deleted_at IS NULL) AS entryCount
        FROM transactions t WHERE t.deleted_at IS NULL AND t.consolidation_parent_transaction_id IS NULL ORDER BY t.type, t.sync_id`
    );

export const balanceOf = (database: DB, accountTitle: string) =>
    queryRows<{ readonly amount: number }>(
        database,
        `SELECT b.amount AS amount FROM account_balances b INNER JOIN accounts a ON a.id = b.account_id WHERE a.title = ?`,
        [accountTitle]
    ).pipe(Effect.map(rows => rows.at(0)?.amount ?? 0));

export const unconsolidateOn = (database: DB, transferId: number) =>
    Effect.flatMap(UnconsolidationService, service => service.unconsolidateById(transferId)).pipe(
        Effect.provide(UnconsolidationService.layer),
        Effect.provideService(Db, database)
    );

export const setupMemberHousehold = (
    bobDatabase: DB,
    options: { readonly isBobAccountManual: boolean; readonly isAliceAccountShared: boolean }
) =>
    Effect.gen(function* () {
        yield* prepareHousehold(bobDatabase, SyncZoneRoleEnum.PARTICIPANT);

        const clouds = makeMemberClouds();
        const seedAlice = new TestSeedService(testDb);
        const seedBob = new TestSeedService(bobDatabase);
        const aliceAccount = yield* seedAlice.bankSyncAccount(PRIVATE_ACCOUNT_TITLE, ExternalSourceEnum.MONOBANK, ALICE_IBAN);
        const bobAccount = options.isBobAccountManual
            ? yield* seedBob.account({ title: 'Bob cash', iban: BOB_IBAN })
            : yield* seedBob.bankSyncAccount('Bob card', ExternalSourceEnum.MONOBANK, BOB_IBAN);

        yield* shareAccountOn(bobDatabase, bobAccount.id);

        if (options.isAliceAccountShared) {
            yield* shareAccountOn(testDb, aliceAccount.id);
        }

        yield* refreshAllBalances(testDb);
        yield* refreshAllBalances(bobDatabase);

        const settled = yield* settleMembers(bobDatabase, clouds);

        return { clouds, aliceAccount, bobAccount, rejected: settled.rejected };
    });

export const PRIVATE_BOTH_CARDS = { isBobAccountManual: false, isAliceAccountShared: false } as const;
export const SHARED_BOTH_CARDS = { isBobAccountManual: false, isAliceAccountShared: true } as const;
export const MANUAL_BOB_ACCOUNT = { isBobAccountManual: true, isAliceAccountShared: false } as const;

export const withMemberHousehold = <A, E, R>(
    options: Parameters<typeof setupMemberHousehold>[1],
    body: (context: {
        readonly bobDatabase: DB;
        readonly clouds: MemberCloudsInterface;
        readonly aliceAccount: { readonly id: number };
        readonly bobAccount: { readonly id: number };
    }) => Effect.Effect<A, E, R>
) =>
    Effect.gen(function* () {
        const bobDatabase = yield* Db;
        const household = yield* setupMemberHousehold(bobDatabase, options);

        return yield* body({ bobDatabase, ...household });
    });
