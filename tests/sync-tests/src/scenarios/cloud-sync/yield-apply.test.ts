import { AccountTypeEnum, ExternalSourceEnum, TransactionTypeEnum, TransactionYieldRepository, YieldKindEnum } from '@budgie/contracts';
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
    resetTestDb,
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

const seedYieldIncome = (deviceB: DB, cloud: FakeCloudTransport, yieldKind: YieldKindEnum) =>
    Effect.gen(function* () {
        yield* resetTestDb(deviceB);

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
        yield* pushDevice(testDb, cloud);
        yield* pullDevice(deviceB, cloud, DEVICE_B);
        yield* pullDevice(testDb, cloud, DEVICE_A);

        return { bank, deposit, income };
    });

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
    });
});
