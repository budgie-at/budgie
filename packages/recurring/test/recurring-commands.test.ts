import { resetTestDb } from '@budgie-at/test-kit';
import {
    ExchangeRateEntityTable,
    PRECISION,
    RecurringCadenceUnitEnum,
    RecurringMatchSourceEnum,
    RecurringSeriesKindEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesStatusEnum,
    RecurringSeriesUserStateEnum
} from '@budgie/contracts';
import { beforeEach, expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { RecurringAlertEnum, RecurringRefreshService, RecurringSeriesNotFoundError, RecurringService } from '../src/index';
import { RecurringRepository } from '../src/repository/recurring.repository';

import { DEFAULT_INSTRUMENT_ID, NOW, seedCharges, seedDetectedSeries, seedMonthlyCharges, seedNetflixCharge } from './recurring-seed';
import { TestLayer, detectAt, findSeries, setUserState, testDb } from './test-context';

import type { RecurringManualInputInterface } from '../src/index';

const manualInput = (overrides: Partial<RecurringManualInputInterface> = {}): RecurringManualInputInterface => ({
    kind: RecurringSeriesKindEnum.EXPENSE,
    title: 'Netflix',
    amount: 12 * PRECISION,
    instrumentId: DEFAULT_INSTRUMENT_ID,
    cadenceUnit: RecurringCadenceUnitEnum.MONTH,
    cadenceInterval: 1,
    anchorDate: new Date(2026, 5, 5),
    ...overrides
});

const recurringService = Effect.service(RecurringService);

const refreshService = Effect.service(RecurringRefreshService);

const repository = Effect.service(RecurringRepository);

const openReads = Effect.flatMap(refreshService, refresh => refresh.refresh(NOW));

const allLinks = Effect.flatMap(repository, items => items.findLinks());

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

layer(TestLayer)('recurringService commands', it => {
    it.effect('creates manual series that count immediately and appear in the calendar and list', () =>
        Effect.gen(function* () {
            const service = yield* recurringService;
            yield* openReads;
            const created = yield* service.createManual(manualInput({ reminderDaysBefore: 1 }));
            const calendar = yield* service.calendar(2026, 6, NOW);
            const [item] = yield* service.listSeries(NOW);

            expect(created).toMatchObject({
                source: RecurringSeriesSourceEnum.MANUAL,
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                status: RecurringSeriesStatusEnum.ACTIVE,
                confidence: 100,
                merchantKey: '',
                reminderDaysBefore: 1
            });
            expect(calendar.forecastedEntriesByDay.get(5)?.map(entry => entry.latestAmount)).toEqual([12 * PRECISION]);
            expect(item).toMatchObject({ id: created.id, isActive: true, amount: 12 * PRECISION, nativeAmount: 12 * PRECISION });
            expect(item.nextDate).toEqual(new Date(2026, 6, 5));
            expect(item.monthlyEquivalent).toBe(12 * PRECISION);
        })
    );

    it.effect('converts own-currency amounts with the latest rate for reads', () =>
        Effect.gen(function* () {
            const service = yield* recurringService;
            yield* openReads;
            yield* testDb
                .insert(ExchangeRateEntityTable)
                .values({ baseInstrumentId: 2, quoteInstrumentId: DEFAULT_INSTRUMENT_ID, rate: 2 });
            const created = yield* service.createManual(manualInput({ instrumentId: 2, amount: 10 * PRECISION }));
            const [item] = yield* service.listSeries(NOW);

            expect(item).toMatchObject({
                id: created.id,
                nativeAmount: 10 * PRECISION,
                amount: 20 * PRECISION,
                instrumentId: 2,
                monthlyEquivalent: 20 * PRECISION
            });
        })
    );

    it.effect('confirms detected series on edit and keeps manual series confirmed', () =>
        Effect.gen(function* () {
            const service = yield* recurringService;
            const { detected } = yield* seedDetectedSeries();
            const manual = yield* service.createManual(manualInput({ title: 'Gym' }));

            const editedDetected = yield* service.update(detected.id, { cadenceUnit: RecurringCadenceUnitEnum.YEAR, cadenceInterval: 2 });
            const editedManual = yield* service.update(manual.id, { title: 'Gym membership' });

            expect(detected.userState).toBe(RecurringSeriesUserStateEnum.SUGGESTED);
            expect(editedDetected).toMatchObject({
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                cadenceInterval: 2,
                periodDays: 731
            });
            expect(editedManual).toMatchObject({ userState: RecurringSeriesUserStateEnum.CONFIRMED, title: 'Gym membership' });
        })
    );

    it.effect('deletes manual series with their links and restores them', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const ids = yield* seedMonthlyCharges(seed, 'NETFLIX', [1, 0], 5, 12);
            const service = yield* recurringService;
            const refresh = yield* refreshService;
            const created = yield* service.createManual(manualInput());
            yield* refresh.matchRecent(NOW);

            const removal = yield* service.remove(created.id);
            const afterRemove = yield* repository.pipe(Effect.flatMap(items => Effect.all([items.findAllSeries(), items.findLinks()])));
            yield* service.restore(created.id);
            const afterRestore = yield* repository.pipe(Effect.flatMap(items => Effect.all([items.findAllSeries(), items.findLinks()])));

            expect(removal).toEqual({
                seriesId: created.id,
                source: RecurringSeriesSourceEnum.MANUAL,
                previousUserState: RecurringSeriesUserStateEnum.CONFIRMED
            });
            expect(afterRemove).toEqual([[], []]);
            expect(afterRestore[0].map(row => row.id)).toEqual([created.id]);
            expect(afterRestore[1].map(link => link.transactionId).sort((first, second) => first - second)).toEqual(
                ids.sort((first, second) => first - second)
            );
        })
    );

    it.effect('dismisses detected series on remove and brings them back as suggestions', () =>
        Effect.gen(function* () {
            const service = yield* recurringService;
            const { detected } = yield* seedDetectedSeries();

            const removal = yield* service.remove(detected.id);
            const [dismissed] = yield* (yield* repository).findAllSeries();
            const restored = yield* setUserState(detected.id, RecurringSeriesUserStateEnum.SUGGESTED);
            const confirmed = yield* service.confirm(detected.id);

            expect(removal).toEqual({
                seriesId: detected.id,
                source: RecurringSeriesSourceEnum.DETECTED,
                previousUserState: RecurringSeriesUserStateEnum.SUGGESTED
            });
            expect(dismissed.userState).toBe(RecurringSeriesUserStateEnum.DISMISSED);
            expect(restored.userState).toBe(RecurringSeriesUserStateEnum.SUGGESTED);
            expect(confirmed.userState).toBe(RecurringSeriesUserStateEnum.CONFIRMED);
        })
    );

    it.effect('adds a transaction to a series by flipping an earlier exclusion and learning the merchant key', () =>
        Effect.gen(function* () {
            const transactionId = yield* seedNetflixCharge();
            const service = yield* recurringService;
            const created = yield* service.createManual(manualInput());

            yield* service.excludeTransaction(created.id, transactionId);
            const excluded = yield* allLinks;
            yield* service.addTransaction(created.id, transactionId);
            const linked = yield* allLinks;
            const [series] = yield* (yield* repository).findAllSeries();
            const owner = yield* service.seriesForTransaction(transactionId);

            expect(excluded).toHaveLength(1);
            expect(excluded[0].isExcluded).toBe(true);
            expect(linked).toHaveLength(1);
            expect(linked[0]).toMatchObject({ isExcluded: false, matchedBy: RecurringMatchSourceEnum.USER, seriesId: created.id });
            expect(series.merchantKey).toBe('EXPENSE|1|NETFLIX');
            expect(owner?.id).toBe(created.id);
        })
    );

    it.effect('moves a transaction between series and excludes it from the previous one', () =>
        Effect.gen(function* () {
            const transactionId = yield* seedNetflixCharge();
            const service = yield* recurringService;
            const first = yield* service.createManual(manualInput());
            const second = yield* service.createManual(manualInput({ title: 'Streaming' }));

            yield* service.addTransaction(first.id, transactionId);
            yield* service.addTransaction(second.id, transactionId);
            const links = yield* allLinks;
            const owner = yield* service.seriesForTransaction(transactionId);

            expect(
                links
                    .map(link => ({ seriesId: link.seriesId, isExcluded: link.isExcluded }))
                    .sort((first, second) => first.seriesId - second.seriesId)
            ).toEqual([
                { seriesId: first.id, isExcluded: true },
                { seriesId: second.id, isExcluded: false }
            ]);
            expect(owner?.id).toBe(second.id);
        })
    );

    it.effect('suggests fitting series by merchant first and amount second', () =>
        Effect.gen(function* () {
            const transactionId = yield* seedNetflixCharge();
            const service = yield* recurringService;
            yield* openReads;
            const byAmount = yield* service.createManual(manualInput({ title: 'Spotify', amount: 12.5 * PRECISION }));
            const byMerchant = yield* service.createManual(manualInput({ title: 'Netflix', amount: 40 * PRECISION }));
            yield* service.createManual(manualInput({ title: 'Rent', amount: 900 * PRECISION }));
            yield* service.createManual(manualInput({ title: 'Salary', kind: RecurringSeriesKindEnum.INCOME }));

            const fitting = yield* service.fittingSeries(transactionId, NOW);

            expect(fitting.map(item => item.id)).toEqual([byMerchant.id, byAmount.id]);
        })
    );

    it.effect('does not suggest a similar amount from another category', () =>
        Effect.gen(function* () {
            const transactionId = yield* seedNetflixCharge();
            const service = yield* recurringService;
            yield* openReads;
            const sameCategory = yield* service.createManual(manualInput({ title: 'Spotify', amount: 12.5 * PRECISION }));
            yield* service.createManual(manualInput({ title: 'Barber', amount: 12.5 * PRECISION, categoryId: 1 }));

            const fitting = yield* service.fittingSeries(transactionId, NOW);

            expect(fitting.map(item => item.id)).toEqual([sameCategory.id]);
        })
    );

    it.effect('revives a dismissed detected series with the same counterparty instead of duplicating it', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const ids = yield* seedMonthlyCharges(seed, 'NETFLIX', [5, 4, 3, 2, 1, 0], 5, 12);
            const service = yield* recurringService;
            yield* detectAt(NOW);
            const [detected] = yield* (yield* repository).findAllSeries();
            yield* setUserState(detected.id, RecurringSeriesUserStateEnum.DISMISSED);
            yield* (yield* repository).updateSeries(detected.id, { merchantKey: 'EXPENSE|2|NETFLIX|12000000' });

            const revived = yield* service.makeRecurringFromTransaction(
                ids[5],
                manualInput({ title: 'Netflix HD', amount: 13 * PRECISION })
            );
            const rows = yield* (yield* repository).findAllSeries();
            const links = yield* allLinks;

            expect(rows).toHaveLength(1);
            expect(revived).toMatchObject({
                id: detected.id,
                source: RecurringSeriesSourceEnum.DETECTED,
                userState: RecurringSeriesUserStateEnum.CONFIRMED,
                title: 'Netflix HD',
                amount: 13 * PRECISION
            });
            expect(links.find(link => link.transactionId === ids[5])).toMatchObject({
                matchedBy: RecurringMatchSourceEnum.USER,
                isExcluded: false
            });
        })
    );

    it.effect('creates a manual series linked to the transaction when nothing can be revived', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const [transactionId] = yield* seedMonthlyCharges(seed, 'GYM', [0], 9, 30);
            const service = yield* recurringService;

            const created = yield* service.makeRecurringFromTransaction(
                transactionId,
                manualInput({ title: 'Gym', amount: 30 * PRECISION, anchorDate: new Date(2026, 5, 9) })
            );
            const links = yield* allLinks;

            expect(created).toMatchObject({ source: RecurringSeriesSourceEnum.MANUAL, merchantKey: 'EXPENSE|1|GYM' });
            expect(links).toHaveLength(1);
            expect(links[0]).toMatchObject({ seriesId: created.id, transactionId, matchedBy: RecurringMatchSourceEnum.USER });
        })
    );

    it.effect('reports overdue, ending and price drift alerts and fails for unknown series', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const [cheap] = yield* seedMonthlyCharges(seed, 'NETFLIX', [0], 5, 16);
            const service = yield* recurringService;
            yield* openReads;
            const overdue = yield* service.createManual(manualInput({ title: 'Insurance', anchorDate: new Date(2026, 4, 3) }));
            const ending = yield* service.createManual(
                manualInput({ title: 'Loan', anchorDate: new Date(2026, 5, 20), endsAt: new Date(2026, 6, 1) })
            );
            const drift = yield* service.createManual(manualInput({ title: 'Netflix' }));
            yield* service.addTransaction(drift.id, cheap);

            const items = yield* service.listSeries(NOW);
            const alertOf = (id: number) => items.find(item => item.id === id)?.alert;
            const detail = yield* service.getSeriesDetail(drift.id, NOW);
            const failure = yield* Effect.flip(service.getSeriesDetail(9999, NOW));

            expect(alertOf(overdue.id)).toBe(RecurringAlertEnum.OVERDUE);
            expect(alertOf(ending.id)).toBe(RecurringAlertEnum.ENDING);
            expect(alertOf(drift.id)).toBe(RecurringAlertEnum.PRICE_CHANGE);
            expect(detail.history).toMatchObject([{ transactionId: cheap, amount: 16 * PRECISION, isExcluded: false }]);
            expect(detail.nextDates).toEqual([new Date(2026, 6, 5), new Date(2026, 7, 5), new Date(2026, 8, 5)]);
            expect(failure).toBeInstanceOf(RecurringSeriesNotFoundError);
        })
    );

    it.effect('restores the exact previous state after removing a confirmed detected series', () =>
        Effect.gen(function* () {
            const service = yield* recurringService;
            const { detected } = yield* seedDetectedSeries();
            yield* service.confirm(detected.id);

            const removal = yield* service.remove(detected.id);
            const [dismissed] = yield* findSeries();
            yield* service.restoreUserState(detected.id, removal.previousUserState);
            const [restored] = yield* findSeries();

            expect(removal.previousUserState).toBe(RecurringSeriesUserStateEnum.CONFIRMED);
            expect(dismissed.userState).toBe(RecurringSeriesUserStateEnum.DISMISSED);
            expect(restored.userState).toBe(RecurringSeriesUserStateEnum.CONFIRMED);
        })
    );

    it.effect('does not let a dismissed series own a transaction but keeps its automatic links', () =>
        Effect.gen(function* () {
            const seed = yield* seedCharges();
            const [transactionId] = yield* seedMonthlyCharges(seed, 'NETFLIX', [5, 4, 3, 2], 5, 12);
            const service = yield* recurringService;
            yield* detectAt(NOW);
            const [detected] = yield* findSeries();

            const owned = yield* service.seriesForTransaction(transactionId);
            yield* service.remove(detected.id);
            const afterDismiss = yield* service.seriesForTransaction(transactionId);
            const links = yield* (yield* repository).findLinksByTransactionId(transactionId);

            expect(owned?.id).toBe(detected.id);
            expect(afterDismiss).toBeNull();
            expect(links).toHaveLength(1);
        })
    );

    it.effect('confirms a detected series on a schedule edit but not on a reminder-only edit', () =>
        Effect.gen(function* () {
            const service = yield* recurringService;
            const { detected } = yield* seedDetectedSeries();

            const reminded = yield* service.update(detected.id, { reminderDaysBefore: 3 });
            const retitled = yield* service.update(detected.id, { title: 'Streaming' });

            expect(reminded).toMatchObject({ userState: RecurringSeriesUserStateEnum.SUGGESTED, reminderDaysBefore: 3 });
            expect(retitled.userState).toBe(RecurringSeriesUserStateEnum.CONFIRMED);
        })
    );
});
