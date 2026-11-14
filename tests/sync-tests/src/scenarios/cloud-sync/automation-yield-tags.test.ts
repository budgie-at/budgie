import { AccountTypeEnum, ExternalSourceEnum, INVESTMENTS_CATEGORY_ID, TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { YieldTagRepairService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    Db,
    FakeCloudTransport,
    makeTestDbLayer,
    OPERATED_AT,
    pullWithAutomation,
    pushDevice,
    readOutboxRows,
    resetTestDb,
    testDb,
    TestSeedService
} from '../../harness';

import type { DB } from '@budgie/contracts';

const seedEarnIncome = (seed: TestSeedService, accountId: number, title: string, externalId: string) =>
    seed.manualExpense({
        accountId,
        amount: 1_000_000,
        operatedAt: OPERATED_AT,
        title,
        type: TransactionTypeEnum.INCOME,
        externalId,
        externalSource: ExternalSourceEnum.BINANCE
    });

const yieldKindsOf = (database: DB, title: string) =>
    database.$client.unsafe<{ readonly yieldKind: string | null }>(`SELECT yield_kind AS yieldKind FROM transactions WHERE title = ?`, [
        title
    ]);

const setupDevices = Effect.gen(function* () {
    const deviceB = yield* Db;

    yield* resetTestDb(deviceB);

    const seed = new TestSeedService(testDb);

    return {
        deviceB,
        cloud: new FakeCloudTransport(),
        seed,
        binance: yield* seed.account({ title: 'BNB', type: AccountTypeEnum.CRYPTO_SYNC })
    };
});

describe('cloud-sync/automation-yield-tags', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('tags rows a cloud apply delivers untagged, without uploading the tags', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, seed, binance } = yield* setupDevices;

                yield* seedEarnIncome(seed, binance.id, 'Earn', 'binance:earn:BNB:2026-06-01');
                yield* pushDevice(testDb, cloud);
                yield* pullWithAutomation(deviceB, cloud, 'device-b');

                const rows = yield* yieldKindsOf(deviceB, 'Earn');

                expect(rows).toEqual([{ yieldKind: YieldKindEnum.EARN }]);
                expect(yield* readOutboxRows(deviceB)).toEqual([]);
            })
        );

        it.effect('leaves an incoming NONE row and an already tagged row untouched', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, seed, binance } = yield* setupDevices;
                const deposit = yield* seed.account({ title: 'Deposit', type: AccountTypeEnum.DEPOSIT });

                for (const title of ['Opted out', 'Staked']) {
                    yield* seedEarnIncome(seed, binance.id, title, `binance:earn:BNB:${title}`);
                }

                yield* testDb.$client.unsafe(`UPDATE transactions SET yield_kind = ? WHERE title = 'Opted out'`, [YieldKindEnum.NONE]);
                yield* testDb.$client.unsafe(`UPDATE transactions SET yield_kind = ?, yield_source_account_id = ? WHERE title = 'Staked'`, [
                    YieldKindEnum.STAKING,
                    deposit.id
                ]);
                yield* pushDevice(testDb, cloud);
                yield* pullWithAutomation(deviceB, cloud, 'device-b');

                const rows = yield* deviceB.$client.unsafe<{
                    readonly title: string;
                    readonly yieldKind: string | null;
                    readonly source: string | null;
                }>(
                    `SELECT t.title AS title, t.yield_kind AS yieldKind, a.title AS source FROM transactions t
                    LEFT JOIN accounts a ON a.id = t.yield_source_account_id WHERE t.title IN ('Opted out', 'Staked') ORDER BY t.title`
                );

                expect(rows).toEqual([
                    { title: 'Opted out', yieldKind: YieldKindEnum.NONE, source: null },
                    { title: 'Staked', yieldKind: YieldKindEnum.STAKING, source: 'Deposit' }
                ]);
                expect(yield* readOutboxRows(deviceB)).toEqual([]);
            })
        );

        it.effect.each([YieldKindEnum.STAKING, YieldKindEnum.EARN, YieldKindEnum.DISTRIBUTION])(
            'restores the category for a local %s after an older device uploads NULL',
            yieldKind =>
                Effect.gen(function* () {
                    const { deviceB, cloud, seed, binance } = yield* setupDevices;

                    yield* seedEarnIncome(seed, binance.id, 'Mixed version', 'binance:earn:BNB:mixed');
                    yield* pushDevice(testDb, cloud);
                    yield* pullWithAutomation(deviceB, cloud, 'device-b');
                    yield* deviceB.$client.unsafe('UPDATE sync_apply_state SET is_applying = 1');
                    yield* deviceB.$client.unsafe('UPDATE transactions SET yield_kind = ?', [yieldKind]);
                    yield* deviceB.$client.unsafe('UPDATE sync_apply_state SET is_applying = 0');
                    yield* testDb.$client.unsafe("UPDATE transactions SET title = 'Older edit' WHERE title = 'Mixed version'");
                    yield* testDb.$client.unsafe('UPDATE transaction_entries SET category_id = NULL');
                    yield* pushDevice(testDb, cloud);
                    yield* pullWithAutomation(deviceB, cloud, 'device-b');

                    expect(yield* yieldKindsOf(deviceB, 'Older edit')).toEqual([{ yieldKind }]);
                    expect(
                        yield* deviceB.$client.unsafe<{ readonly categoryId: number | null }>(
                            'SELECT category_id AS categoryId FROM transaction_entries'
                        )
                    ).toEqual([{ categoryId: INVESTMENTS_CATEGORY_ID }]);
                    expect(yield* readOutboxRows(deviceB)).toEqual([]);
                })
        );

        it.effect('chunks a large sync id list (40000 ids) when repairing', () =>
            Effect.gen(function* () {
                const seed = new TestSeedService(testDb);

                yield* resetTestDb(testDb);

                const binance = yield* seed.account({ title: 'BNB', type: AccountTypeEnum.CRYPTO_SYNC });

                yield* seedEarnIncome(seed, binance.id, 'Late earn', 'binance:earn:BNB:late');

                const [{ syncId }] = yield* testDb.$client.unsafe<{ readonly syncId: string }>(
                    `SELECT sync_id AS syncId FROM transactions WHERE title = 'Late earn'`
                );
                const syncIds = [...Array.from({ length: 40000 }, (_, index) => `missing-${index}`), syncId];

                yield* Effect.flatMap(YieldTagRepairService, service => service.repairBySyncIds(syncIds)).pipe(
                    Effect.provide(YieldTagRepairService.layer),
                    Effect.provideService(Db, testDb)
                );

                const rows = yield* yieldKindsOf(testDb, 'Late earn');

                expect(rows).toEqual([{ yieldKind: YieldKindEnum.EARN }]);
            })
        );
    });
});
