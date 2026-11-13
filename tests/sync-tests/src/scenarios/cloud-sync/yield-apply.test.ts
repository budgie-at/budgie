import {
    AccountTypeEnum,
    ExternalSourceEnum,
    HOUSEHOLD_SYNC_ZONE,
    PERSONAL_SYNC_ZONE,
    SyncZoneRoleEnum,
    TransactionTypeEnum,
    TransactionYieldRepository,
    YieldKindEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    Db,
    DEVICE_A,
    DEVICE_B,
    FakeCloudTransport,
    makeTestDbLayer,
    OPERATED_AT,
    pullDevice,
    pushDevice,
    refreshAllBalances,
    expectNoRejections,
    pullHousehold,
    pullZones,
    queryRows,
    resetTestDb,
    shareAndUpload,
    shareDevices,
    startHousehold,
    uploadDevice,
    testDb,
    TestSeedService
} from '../../harness';

import type { DB } from '@budgie/contracts';

const KEY = 'yield-apply-key';

const yieldOf = (database: DB) =>
    database.$client
        .unsafe<{ readonly yieldKind: string | null; readonly sourceTitle: string | null; readonly title: string; readonly type: string }>(
            `SELECT t.yield_kind AS yieldKind, a.title AS sourceTitle, t.title AS title, t.type AS type FROM transactions t
            LEFT JOIN accounts a ON a.id = t.yield_source_account_id WHERE t.comment = ?`,
            [KEY]
        )
        .pipe(Effect.map(([row]) => row));

const onRepository = <A, E>(effect: (repository: TransactionYieldRepository['Service']) => Effect.Effect<A, E, Db>) =>
    Effect.flatMap(TransactionYieldRepository, effect).pipe(
        Effect.provide(TransactionYieldRepository.layer),
        Effect.provideService(Db, testDb)
    );

const seedYieldLedger = (yieldKind: YieldKindEnum | null) =>
    Effect.gen(function* () {
        const seed = new TestSeedService(testDb);
        const bank = yield* seed.account({ title: 'Bank' });
        const deposit = yield* seed.account({ title: 'Deposit', type: AccountTypeEnum.DEPOSIT });
        const income = yield* seed.manualExpense({
            accountId: bank.id,
            amount: 1_000_000,
            operatedAt: OPERATED_AT,
            title: 'Payout',
            comment: KEY,
            type: TransactionTypeEnum.INCOME,
            externalSource: ExternalSourceEnum.BINANCE,
            externalId: 'binance:dividend:42'
        });

        yield* testDb.$client.unsafe(`UPDATE transactions SET yield_kind = ?, yield_source_account_id = ? WHERE id = ?`, [
            yieldKind,
            deposit.id,
            income.id
        ]);
        yield* refreshAllBalances(testDb);

        return { bank, deposit, income };
    });

const seedYieldIncome = (deviceB: DB, cloud: FakeCloudTransport, yieldKind: YieldKindEnum | null) =>
    Effect.gen(function* () {
        yield* resetTestDb(deviceB);

        const seeded = yield* seedYieldLedger(yieldKind);

        yield* pushDevice(testDb, cloud);
        yield* pullDevice(deviceB, cloud, DEVICE_B);
        yield* pullDevice(testDb, cloud, DEVICE_A);

        return seeded;
    });

const deliverEditFromB = <E>(prepareLocal: Effect.Effect<unknown, E>, assignment: string) =>
    Effect.gen(function* () {
        const deviceB = yield* Db;
        const cloud = new FakeCloudTransport();

        yield* seedYieldIncome(deviceB, cloud, YieldKindEnum.DIVIDEND);
        yield* prepareLocal;
        yield* deviceB.$client.unsafe(`UPDATE transactions SET ${assignment}, title = 'Edited on B' WHERE comment = ?`, [KEY]);
        yield* pushDevice(deviceB, cloud);
        yield* pullDevice(testDb, cloud, DEVICE_A);
    });

const deliverNullSourceFromB = <E>(prepareLocal: Effect.Effect<unknown, E>) =>
    deliverEditFromB(prepareLocal, 'yield_source_account_id = NULL');

describe('cloud-sync/yield-apply', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('delivers a Binance refinement to the other device', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const { income } = yield* seedYieldIncome(deviceB, cloud, YieldKindEnum.DISTRIBUTION);

                yield* onRepository(repository => repository.refineImportedYieldKind(income.id, YieldKindEnum.STAKING));
                yield* pushDevice(testDb, cloud);
                yield* pullDevice(deviceB, cloud, DEVICE_B);

                expect(yield* yieldOf(deviceB)).toMatchObject({ yieldKind: YieldKindEnum.STAKING, sourceTitle: 'Deposit' });
            })
        );

        it.effect.each([YieldKindEnum.NONE, YieldKindEnum.DISTRIBUTION])(
            'keeps a local %s when another device re-uploads the record without yield_kind',
            yieldKind =>
                Effect.gen(function* () {
                    const deviceB = yield* Db;
                    const cloud = new FakeCloudTransport();

                    yield* seedYieldIncome(deviceB, cloud, yieldKind);
                    yield* deviceB.$client.unsafe(`UPDATE transactions SET yield_kind = NULL, title = 'Edited on B' WHERE comment = ?`, [
                        KEY
                    ]);
                    yield* pushDevice(deviceB, cloud);
                    yield* pullDevice(testDb, cloud, DEVICE_A);

                    expect(yield* yieldOf(testDb)).toMatchObject({ yieldKind, title: 'Edited on B' });
                })
        );

        it.effect('nulls both fields when the incoming type no longer allows yield, whatever the local kind', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* seedYieldIncome(deviceB, cloud, YieldKindEnum.STAKING);
                yield* deviceB.$client.unsafe(
                    `UPDATE transactions SET type = 'ADJUSTMENT', yield_kind = NULL, yield_source_account_id = NULL WHERE comment = ?`,
                    [KEY]
                );
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* yieldOf(testDb)).toMatchObject({ type: 'ADJUSTMENT', yieldKind: null, sourceTitle: null });
            })
        );

        it.effect('normalizes an invalid kind delivered by another device', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* seedYieldIncome(deviceB, cloud, null);
                yield* deviceB.$client.unsafe(`UPDATE transactions SET yield_kind = 'TAX' WHERE comment = ?`, [KEY]);
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(yield* yieldOf(testDb)).toMatchObject({ yieldKind: null, sourceTitle: null });
            })
        );

        it.effect('ignores an incoming null source when the local source shares the zone, and never holds the record', () =>
            Effect.gen(function* () {
                yield* deliverNullSourceFromB(Effect.void);

                expect(yield* yieldOf(testDb)).toMatchObject({
                    yieldKind: YieldKindEnum.DIVIDEND,
                    sourceTitle: 'Deposit',
                    title: 'Edited on B'
                });
                expect(yield* testDb.$client.unsafe<{ readonly total: number }>(`SELECT COUNT(*) AS total FROM sync_pending`)).toEqual([
                    { total: 0 }
                ]);
            })
        );

        it.effect('applies an incoming null source when the local source is now in another zone', () =>
            Effect.gen(function* () {
                yield* deliverNullSourceFromB(
                    testDb.$client.unsafe(`UPDATE accounts SET sync_zone = ? WHERE title = 'Deposit'`, [HOUSEHOLD_SYNC_ZONE])
                );

                expect(yield* yieldOf(testDb)).toMatchObject({ yieldKind: YieldKindEnum.DIVIDEND, sourceTitle: null });
            })
        );

        it.effect('keeps a same-zone source when the local parent has no entries', () =>
            Effect.gen(function* () {
                yield* deliverNullSourceFromB(
                    testDb.$client
                        .unsafe(`DELETE FROM transaction_entries WHERE transaction_id IN (SELECT id FROM transactions WHERE comment = ?)`, [
                            KEY
                        ])
                        .pipe(
                            Effect.andThen(() => refreshAllBalances(testDb)),
                            Effect.andThen(() => testDb.$client.unsafe(`DELETE FROM sync_outbox`))
                        )
                );

                expect(yield* yieldOf(testDb)).toMatchObject({ yieldKind: YieldKindEnum.DIVIDEND, sourceTitle: 'Deposit' });
            })
        );

        it.effect('nulls an incoming source that lives in another zone', () =>
            Effect.gen(function* () {
                yield* deliverEditFromB(
                    testDb.$client.unsafe(`UPDATE accounts SET sync_zone = ? WHERE title = 'Deposit'`, [HOUSEHOLD_SYNC_ZONE]),
                    'comment = comment'
                );

                expect(yield* yieldOf(testDb)).toMatchObject({ yieldKind: YieldKindEnum.DIVIDEND, sourceTitle: null });
            })
        );

        it.effect('sets the source after the unit is held until the source account arrives', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* seedYieldIncome(deviceB, cloud, YieldKindEnum.DIVIDEND);
                yield* resetTestDb(deviceB);

                const results = yield* pullDevice(deviceB, cloud, 'device-c', { order: 'reverse', chunkSize: 1 });

                expect(results.some(result => result.heldBack > 0)).toBe(true);
                expect(results[results.length - 1].heldBack).toBe(0);
                expect(yield* yieldOf(deviceB)).toMatchObject({ yieldKind: YieldKindEnum.DIVIDEND, sourceTitle: 'Deposit' });
            })
        );
    });

    shareDevices('owner second device', it => {
        it.effect('nulls the local source of a transaction that the owner moved to the household zone', () =>
            Effect.gen(function* () {
                const { deviceB, clouds } = yield* startHousehold(SyncZoneRoleEnum.OWNER);
                const { bank } = yield* seedYieldLedger(YieldKindEnum.DIVIDEND);

                yield* uploadDevice(testDb, clouds);
                yield* pullZones(deviceB, clouds.personal, 'owner-b', [PERSONAL_SYNC_ZONE]);
                yield* shareAndUpload(testDb, clouds, bank.id);
                expectNoRejections(yield* pullHousehold(deviceB, clouds, 'owner-b-household'));

                expect(
                    yield* queryRows(
                        deviceB,
                        `SELECT sync_zone AS zone, yield_kind AS yieldKind, yield_source_account_id AS source FROM transactions`
                    )
                ).toEqual([{ zone: HOUSEHOLD_SYNC_ZONE, yieldKind: YieldKindEnum.DIVIDEND, source: null }]);
            })
        );
    });
});
