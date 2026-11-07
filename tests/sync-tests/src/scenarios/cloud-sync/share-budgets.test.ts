import { TestSeedService, makeTestDbLayer } from '@budgie-at/test-kit';
import { BudgetRepository, computeSpent } from '@budgie/budget';
import { HouseholdShareService } from '@budgie/cloud-sync';
import {
    BudgetCategoryLimitEntityTable,
    BudgetEntityTable,
    BudgetKindEnum,
    BudgetPeriodEnum,
    Db,
    InstrumentEntityTable,
    SyncZoneRoleEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { FakeCloudTransport, testDb } from '../../harness';

import { expectBalancesMatchLedger, refreshAllBalances } from './apply-harness';
import {
    HOUSEHOLD_ZONE,
    PERSONAL_ZONE,
    countRows,
    onShareDevice,
    prepareHousehold,
    pullZones,
    queryRows,
    reconcileDevice,
    uploadDevice
} from './share-harness';

import type { ShareCloudsInterface } from './share-harness';
import type { DB } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
const PERIOD_START = new Date('2026-10-01T00:00:00Z');
const NEXT_PERIOD_START = new Date('2026-11-01T00:00:00Z');
const GROCERIES_ID = 11;
const SHARED_SPENT = 5_000_000;
const PRIVATE_SPENT = 1_000_000;

const makeClouds = (): ShareCloudsInterface => ({ personal: new FakeCloudTransport(), household: new FakeCloudTransport() });

const readSharedSpent = (database: DB, budgetSyncZone: string) =>
    Effect.flatMap(BudgetRepository, repository =>
        repository.findBudgetSpentEntries(PERIOD_START, NEXT_PERIOD_START, 1, budgetSyncZone)
    ).pipe(
        Effect.provide(BudgetRepository.layer),
        Effect.provideService(Db, database),
        Effect.map(entries => computeSpent(entries, 1).spentOverall)
    );

const seedBudgetFixture = Effect.gen(function* () {
    const seed = new TestSeedService(testDb);
    const joint = yield* seed.account({ title: 'Joint' });
    const wallet = yield* seed.account({ title: 'Wallet' });
    const [instrument] = yield* testDb.select().from(InstrumentEntityTable).orderBy(InstrumentEntityTable.id);
    const trip = yield* seed.tag('family trip');

    yield* seed.manualExpense({
        accountId: joint.id,
        amount: SHARED_SPENT,
        operatedAt: OPERATED_AT,
        title: 'Groceries run',
        categoryId: GROCERIES_ID
    });
    yield* seed.manualExpense({
        accountId: wallet.id,
        amount: PRIVATE_SPENT,
        operatedAt: OPERATED_AT,
        title: 'Private snack',
        categoryId: GROCERIES_ID
    });
    yield* refreshAllBalances(testDb);

    const [budget] = yield* testDb
        .insert(BudgetEntityTable)
        .values({
            name: 'Family',
            kind: BudgetKindEnum.MAIN,
            period: BudgetPeriodEnum.MONTHLY,
            periodStartDay: 1,
            useLastDayOfMonth: false,
            overallLimit: 100_000_000,
            otherLimit: 10_000_000,
            instrumentId: instrument.id,
            tagId: trip.id
        })
        .returning();

    yield* testDb.insert(BudgetCategoryLimitEntityTable).values({ budgetId: budget.id, categoryId: GROCERIES_ID, limitAmount: 30_000_000 });

    return { joint, budget };
});

const shareEverything = (database: DB, accountId: number, budgetId: number) =>
    onShareDevice(
        database,
        Effect.flatMap(HouseholdShareService, service =>
            service.shareAccount(accountId).pipe(Effect.andThen(service.shareBudget(budgetId)))
        )
    );

describe('cloud-sync/share-budgets', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('moves a budget with its limits to the household and keeps spending equal on both devices after edits on each', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds = makeClouds();

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

                const { joint, budget } = yield* seedBudgetFixture;

                yield* uploadDevice(testDb, clouds);
                yield* shareEverything(testDb, joint.id, budget.id);
                yield* uploadDevice(testDb, clouds);

                const results = yield* pullZones(deviceB, clouds.household, 'member', [HOUSEHOLD_ZONE]);

                expect(results.flatMap(result => result.rejected)).toEqual([]);
                expect(yield* queryRows(deviceB, `SELECT name, sync_zone, overall_limit FROM budgets`)).toEqual([
                    { name: 'Family', sync_zone: HOUSEHOLD_ZONE, overall_limit: 100_000_000 }
                ]);
                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT c.title AS category, c.sync_zone AS zone, l.limit_amount AS amount FROM budget_category_limits l INNER JOIN categories c ON c.id = l.category_id`
                    )
                ).toEqual([{ category: 'Groceries', zone: HOUSEHOLD_ZONE, amount: 30_000_000 }]);
                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT g.title AS title, g.sync_zone AS zone FROM budgets b INNER JOIN tags g ON g.id = b.tag_id`
                    )
                ).toEqual([{ title: 'family trip', zone: HOUSEHOLD_ZONE }]);
                expect(yield* readSharedSpent(testDb, HOUSEHOLD_ZONE)).toBe(SHARED_SPENT);
                expect(yield* readSharedSpent(deviceB, HOUSEHOLD_ZONE)).toBe(SHARED_SPENT);
                expect(yield* readSharedSpent(testDb, PERSONAL_ZONE)).toBe(SHARED_SPENT + PRIVATE_SPENT);
                expect(yield* readSharedSpent(deviceB, PERSONAL_ZONE)).toBe(SHARED_SPENT);

                yield* deviceB.$client.unsafe(`UPDATE budgets SET overall_limit = 120000000 WHERE sync_zone = ?`, [HOUSEHOLD_ZONE]);
                yield* new TestSeedService(deviceB).manualExpense({
                    accountId: (yield* queryRows<{ readonly id: number }>(deviceB, `SELECT id FROM accounts`))[0].id,
                    amount: 2_000_000,
                    operatedAt: OPERATED_AT,
                    title: 'Member groceries'
                });
                yield* refreshAllBalances(deviceB);
                yield* reconcileDevice(deviceB);
                yield* testDb.$client.unsafe(`UPDATE budget_category_limits SET limit_amount = 35000000 WHERE sync_zone = ?`, [
                    HOUSEHOLD_ZONE
                ]);
                yield* uploadDevice(deviceB, clouds);
                yield* pullZones(testDb, clouds.household, 'owner', [HOUSEHOLD_ZONE]);
                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.household, 'member', [HOUSEHOLD_ZONE]);
                yield* pullZones(testDb, clouds.household, 'owner', [HOUSEHOLD_ZONE]);

                for (const database of [testDb, deviceB]) {
                    expect(yield* queryRows(database, `SELECT overall_limit FROM budgets WHERE sync_zone = ?`, [HOUSEHOLD_ZONE])).toEqual([
                        { overall_limit: 120_000_000 }
                    ]);
                    expect(
                        yield* queryRows(database, `SELECT limit_amount FROM budget_category_limits WHERE sync_zone = ?`, [HOUSEHOLD_ZONE])
                    ).toEqual([{ limit_amount: 35_000_000 }]);
                    expect(yield* readSharedSpent(database, HOUSEHOLD_ZONE)).toBe(SHARED_SPENT + 2_000_000);
                    expect(yield* countRows(database, `sync_pending`)).toBe(0);
                    yield* expectBalancesMatchLedger(database);
                }

                expect(yield* countRows(testDb, `sync_outbox`)).toBe(0);
                expect(
                    yield* onShareDevice(
                        testDb,
                        Effect.flatMap(HouseholdShareService, service => service.findSharedBudgetIds)
                    )
                ).toEqual([budget.id]);
            })
        );

        it.effect('moves the budget back to the personal set on unshare and removes it from the member', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const clouds = makeClouds();

                yield* prepareHousehold(deviceB, SyncZoneRoleEnum.PARTICIPANT);

                const { joint, budget } = yield* seedBudgetFixture;

                yield* uploadDevice(testDb, clouds);
                yield* shareEverything(testDb, joint.id, budget.id);
                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.household, 'member', [HOUSEHOLD_ZONE]);
                yield* onShareDevice(
                    testDb,
                    Effect.flatMap(HouseholdShareService, service => service.unshareBudget(budget.id))
                );
                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.household, 'member', [HOUSEHOLD_ZONE]);

                expect(yield* countRows(deviceB, `budgets`)).toBe(0);
                expect(yield* countRows(deviceB, `budget_category_limits`)).toBe(0);
                expect(yield* queryRows(testDb, `SELECT sync_zone FROM budgets`)).toEqual([{ sync_zone: PERSONAL_ZONE }]);
                expect(
                    yield* queryRows(
                        testDb,
                        `SELECT c.sync_zone AS zone FROM budget_category_limits l INNER JOIN categories c ON c.id = l.category_id`
                    )
                ).toEqual([{ zone: PERSONAL_ZONE }]);
                yield* expectBalancesMatchLedger(testDb);
            })
        );
    });
});
