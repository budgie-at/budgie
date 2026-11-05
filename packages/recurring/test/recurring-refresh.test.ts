import { resetTestDb } from '@budgie-at/test-kit';
import {
    Db,
    PRECISION,
    RecurringCadenceUnitEnum,
    RecurringMatchSourceEnum,
    RecurringSeriesKindEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesUserStateEnum,
    TransactionEntityTable
} from '@budgie/contracts';
import { afterAll, beforeEach, expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { RecurringRefreshService, RecurringService } from '../src/index';
import { RecurringRepository } from '../src/repository/recurring.repository';

import { DEFAULT_INSTRUMENT_ID, JUNE, NOW, seedCharges, seedMonthlyCharges } from './recurring-seed';
import { TestLayer, testDb, testDbHandle } from './test-context';

const SIX_MONTHS = [6, 5, 4, 3, 2, 1] as const;

const withFreshLaunch = Effect.provide(Layer.fresh(Layer.merge(RecurringService.layer, RecurringRefreshService.layer)));

const refreshService = Effect.service(RecurringRefreshService);

const repository = Effect.service(RecurringRepository);

const liveLinks = Effect.flatMap(repository, items => items.findLinks());

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

afterAll(() => testDbHandle.dispose());

layer(TestLayer)('recurringRefreshService', it => {
    it.effect('writes nothing on the second run', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);
            const refresh = yield* refreshService;

            const first = yield* refresh.detect(NOW);
            const second = yield* refresh.detect(NOW);
            const third = yield* refresh.refresh(NOW);
            const rows = yield* (yield* repository).findAllSeries();

            expect(first).toEqual({ seriesWritten: 1, linksWritten: 6, linksDropped: 0 });
            expect(second).toEqual({ seriesWritten: 0, linksWritten: 0, linksDropped: 0 });
            expect(third).toEqual({ seriesWritten: 0, linksWritten: 0, linksDropped: 0 });
            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({
                source: RecurringSeriesSourceEnum.DETECTED,
                cadenceUnit: RecurringCadenceUnitEnum.MONTH,
                cadenceInterval: 1,
                amount: 12 * PRECISION,
                instrumentId: DEFAULT_INSTRUMENT_ID
            });
            expect(rows[0].confidence).toBeGreaterThanOrEqual(60);
        })
    );

    it.effect('runs full detection at most once per 24 hours', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);
            const refresh = yield* refreshService;

            yield* refresh.refresh(NOW);
            yield* seedMonthlyCharges(seed, 'GYM', SIX_MONTHS, 9, 30);
            const sameDay = yield* refresh.refresh(new Date(NOW.getTime() + 3_600_000));
            const nextDay = yield* refresh.refresh(new Date(NOW.getTime() + 25 * 3_600_000));
            const titles = (yield* (yield* repository).findAllSeries()).map(row => row.title);

            expect(sameDay.seriesWritten).toBe(0);
            expect(nextDay.seriesWritten).toBe(1);
            expect(titles).toEqual(['NETFLIX', 'GYM']);
        }).pipe(withFreshLaunch)
    );

    it.effect('collapses concurrent triggers into a single detection', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);
            const refresh = yield* refreshService;

            const summaries = yield* Effect.all([refresh.refresh(NOW), refresh.refresh(NOW), refresh.refresh(NOW)], {
                concurrency: 'unbounded'
            });

            expect(summaries.reduce((total, summary) => total + summary.seriesWritten, 0)).toBe(1);
            expect(summaries.reduce((total, summary) => total + summary.linksWritten, 0)).toBe(6);
            expect(yield* (yield* repository).findAllSeries()).toHaveLength(1);
        }).pipe(withFreshLaunch)
    );

    it.effect('serves reads without detecting', () =>
        Effect.gen(function* () {
            const refresh = yield* refreshService;
            yield* refresh.refresh(NOW);
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);

            const data = yield* Effect.flatMap(RecurringService, service => service.calendar(2026, JUNE + 1, NOW));

            expect(data.forecastedEntriesByDay.size).toBe(0);
            expect(yield* (yield* repository).findAllSeries()).toEqual([]);
        }).pipe(withFreshLaunch)
    );

    it.effect('runs the initial refresh on the first read when nothing triggered one', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);

            const data = yield* Effect.flatMap(RecurringService, service => service.calendar(2026, JUNE + 1, NOW));

            expect(data.forecastedEntriesByDay.get(5)).toHaveLength(1);
            expect(yield* (yield* repository).findAllSeries()).toHaveLength(1);
        }).pipe(withFreshLaunch)
    );

    it.effect('serves stored data when the initial refresh fails and retries it on the next read', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);
            const service = yield* RecurringService;
            const manual = yield* service.createManual({
                kind: RecurringSeriesKindEnum.EXPENSE,
                title: 'Rent',
                amount: 900 * PRECISION,
                instrumentId: DEFAULT_INSTRUMENT_ID,
                cadenceUnit: RecurringCadenceUnitEnum.MONTH,
                cadenceInterval: 1,
                anchorDate: new Date(2026, 5, 1)
            });
            yield* testDb.$client.unsafe(
                "CREATE TRIGGER block_links BEFORE INSERT ON recurring_series_transaction BEGIN SELECT RAISE(ABORT, 'blocked'); END"
            );

            const failed = yield* service.listSeries(NOW);
            yield* testDb.$client.unsafe('DROP TRIGGER block_links');
            const retried = yield* service.listSeries(NOW);

            expect(failed.map(item => item.id)).toEqual([manual.id]);
            expect(retried.map(item => item.title).sort()).toEqual(['NETFLIX', 'Rent']);
        }).pipe(withFreshLaunch)
    );

    it.effect('never rewrites identity or schedule of an edited series whose links were all re-validated away', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const oldIds = yield* seedMonthlyCharges(seed, 'NETFLIX', [5, 4, 3, 2], 5, 12);
            const refresh = yield* refreshService;
            const service = yield* RecurringService;
            yield* refresh.detect(NOW);
            const [series] = yield* (yield* repository).findAllSeries();
            const anchorDate = new Date(2026, 0, 1);
            yield* service.update(series.id, { anchorDate });
            yield* Effect.forEach(oldIds, id =>
                Db.query(database =>
                    database.update(TransactionEntityTable).set({ deletedAt: new Date() }).where(eq(TransactionEntityTable.id, id))
                )
            );
            yield* seedMonthlyCharges(seed, 'NETFLIX', [3, 2, 1, 0], 9, 12);

            yield* refresh.detect(NOW);
            const rows = yield* (yield* repository).findAllSeries();

            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ id: series.id, anchorDate, merchantKey: series.merchantKey, periodDays: series.periodDays });
        })
    );

    it.effect('ignores transactions excluded from every series during detection', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const ids = yield* seedMonthlyCharges(seed, 'NETFLIX', [5, 4, 3, 2], 5, 12);
            const refresh = yield* refreshService;
            const service = yield* RecurringService;
            yield* refresh.detect(NOW);
            const [series] = yield* (yield* repository).findAllSeries();
            const lastSeenBefore = series.lastSeenAt.getTime();

            yield* service.excludeTransaction(series.id, ids[3]);
            yield* refresh.detect(NOW);
            const [after] = yield* (yield* repository).findAllSeries();
            const links = yield* liveLinks;

            expect(after.lastSeenAt.getTime()).toBeLessThan(lastSeenBefore);
            expect(links.filter(link => !link.isExcluded)).toHaveLength(3);
            expect(links.find(link => link.transactionId === ids[3])).toMatchObject({ isExcluded: true });
        })
    );

    it.effect('drops AUTO links whose transaction was deleted or moved off its cycle', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const ids = yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);
            const refresh = yield* refreshService;
            yield* refresh.detect(NOW);

            yield* Db.query(database =>
                database.update(TransactionEntityTable).set({ deletedAt: new Date() }).where(eq(TransactionEntityTable.id, ids[0]))
            );
            yield* Db.query(database =>
                database
                    .update(TransactionEntityTable)
                    .set({ operatedAt: new Date(2026, 3, 25, 12) })
                    .where(eq(TransactionEntityTable.id, ids[2]))
            );
            const summary = yield* refresh.detect(NOW);
            const links = yield* liveLinks;

            expect(summary.linksDropped).toBe(2);
            expect(links.map(link => link.transactionId).sort((first, second) => first - second)).toEqual(
                [ids[1], ids[3], ids[4], ids[5]].sort((first, second) => first - second)
            );
        })
    );

    it.effect('lets soft-deleted series release their transactions to other series', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const ids = yield* seedMonthlyCharges(seed, 'NETFLIX', [2, 1, 0], 5, 12);
            const service = yield* RecurringService;
            const refresh = yield* refreshService;
            const input = {
                kind: RecurringSeriesKindEnum.EXPENSE,
                title: 'Netflix',
                amount: 12 * PRECISION,
                instrumentId: DEFAULT_INSTRUMENT_ID,
                cadenceUnit: RecurringCadenceUnitEnum.MONTH,
                cadenceInterval: 1,
                anchorDate: new Date(2026, 5, 5)
            } as const;
            const first = yield* service.createManual(input);
            yield* refresh.matchRecent(NOW);
            const firstLinks = (yield* liveLinks).filter(link => link.seriesId === first.id);

            yield* service.remove(first.id);
            const second = yield* service.createManual(input);
            yield* refresh.matchRecent(NOW);
            const secondLinks = (yield* liveLinks).filter(link => link.seriesId === second.id);

            expect(firstLinks.map(link => link.transactionId).sort((first, second) => first - second)).toEqual(
                [ids[1], ids[2]].sort((first, second) => first - second)
            );
            expect(secondLinks.map(link => link.transactionId).sort((first, second) => first - second)).toEqual(
                [ids[1], ids[2]].sort((first, second) => first - second)
            );
        })
    );

    it.effect('never rewrites user-owned fields of confirmed series and follows detected prices', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', [5, 4, 3, 2], 5, 12);
            const refresh = yield* refreshService;
            const service = yield* RecurringService;
            yield* refresh.detect(NOW);
            const [series] = yield* (yield* repository).findAllSeries();
            const edited = yield* service.update(series.id, {
                title: 'My streaming',
                categoryId: null,
                accountId: null,
                cadenceUnit: RecurringCadenceUnitEnum.MONTH,
                cadenceInterval: 1,
                endsAt: new Date(2027, 0, 5),
                reminderDaysBefore: 3
            });

            yield* seedMonthlyCharges(seed, 'NETFLIX', [1, 0], 5, 14);
            yield* refresh.detect(NOW);
            const [after] = yield* (yield* repository).findAllSeries();

            expect(edited.userState).toBe(RecurringSeriesUserStateEnum.CONFIRMED);
            expect(after).toMatchObject({
                id: series.id,
                title: 'My streaming',
                endsAt: new Date(2027, 0, 5),
                reminderDaysBefore: 3,
                anchorDate: series.anchorDate,
                userState: RecurringSeriesUserStateEnum.CONFIRMED
            });
            expect(after.amount).toBe(14 * PRECISION);
        })
    );

    it.effect('keeps a dismissed series dismissed while updating its observed facts', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            yield* seedMonthlyCharges(seed, 'NETFLIX', [5, 4, 3, 2], 5, 12);
            const refresh = yield* refreshService;
            const service = yield* RecurringService;
            yield* refresh.detect(NOW);
            const [series] = yield* (yield* repository).findAllSeries();
            yield* service.dismiss(series.id);

            yield* seedMonthlyCharges(seed, 'NETFLIX', [1, 0], 5, 12);
            yield* refresh.detect(NOW);
            const rows = yield* (yield* repository).findAllSeries();
            const items = yield* service.listSeries(NOW);

            expect(rows).toHaveLength(1);
            expect(rows[0]).toMatchObject({ id: series.id, userState: RecurringSeriesUserStateEnum.DISMISSED });
            expect(rows[0].lastSeenAt.getTime()).toBeGreaterThan(series.lastSeenAt.getTime());
            expect(items).toEqual([]);
        })
    );

    it.effect('leaves USER links and exclusions untouched', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const ids = yield* seedMonthlyCharges(seed, 'NETFLIX', SIX_MONTHS, 5, 12);
            const refresh = yield* refreshService;
            const service = yield* RecurringService;
            yield* refresh.detect(NOW);
            const [series] = yield* (yield* repository).findAllSeries();
            yield* service.excludeTransaction(series.id, ids[0]);
            yield* service.addTransaction(series.id, ids[1]);

            yield* refresh.detect(NOW);
            yield* refresh.matchRecent(NOW);
            const links = yield* liveLinks;

            expect(links.find(link => link.transactionId === ids[0])).toMatchObject({
                isExcluded: true,
                matchedBy: RecurringMatchSourceEnum.USER
            });
            expect(links.find(link => link.transactionId === ids[1])).toMatchObject({
                isExcluded: false,
                matchedBy: RecurringMatchSourceEnum.USER
            });
            expect(links.filter(link => link.transactionId === ids[0])).toHaveLength(1);
        })
    );
});
