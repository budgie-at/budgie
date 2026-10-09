import { Db, RecurringSeriesStatusEnum, RecurringSeriesUserStateEnum, SettingsRepository } from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { RecurringRepository } from '../repository/recurring.repository';
import { projectRecurringMonth } from '../series/recurring-projection';
import { detectRecurringSeries, isSeriesActive, legacyLabel, nearestCycle } from '../series/recurring-series';
import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';
import type { RecurringTrackedSeriesInterface } from '../interface/recurring-tracked-series.interface';
import type { RecurringSeriesCreateEntityInterface, RecurringSeriesEntityInterface } from '@budgie/contracts';

const HISTORY_MONTHS = 24;

export class RecurringService extends Context.Service<RecurringService>()('@budgie/recurring/RecurringService', {
    make: Effect.gen(function* () {
        const recurringRepository = yield* RecurringRepository;
        const settingsRepository = yield* SettingsRepository;

        const toFacts = (series: RecurringSeriesInterface, now: Date) => ({
            kind: series.kind,
            merchantKey: series.merchantKey,
            periodDays: Math.round(series.periodDays),
            amount: series.predictedAmount,
            status: isSeriesActive(series, now) ? RecurringSeriesStatusEnum.ACTIVE : RecurringSeriesStatusEnum.ENDED,
            categoryId: series.categoryId,
            lastSeenAt: new Date(series.anchorTimestamp)
        });

        const isUnchanged = (row: RecurringSeriesEntityInterface, facts: ReturnType<typeof toFacts>): boolean =>
            row.kind === facts.kind &&
            row.merchantKey === facts.merchantKey &&
            row.periodDays === facts.periodDays &&
            row.amount === facts.amount &&
            row.status === facts.status &&
            row.categoryId === facts.categoryId &&
            row.lastSeenAt.getTime() === facts.lastSeenAt.getTime();

        const store = (
            series: RecurringSeriesInterface,
            row: RecurringSeriesEntityInterface | null | undefined,
            facts: ReturnType<typeof toFacts>
        ) => {
            if (!isDefined(row)) {
                const input: RecurringSeriesCreateEntityInterface = {
                    ...facts,
                    title: series.title,
                    userState: RecurringSeriesUserStateEnum.SUGGESTED
                };

                return recurringRepository.createSeries(input);
            }

            return isUnchanged(row, facts) ? Effect.succeed(row) : recurringRepository.updateSeries(row.id, facts);
        };

        const isQualifiedIdentity = (key: string): boolean => {
            const segments = key.split('|');

            return segments.length >= 4 && (/^\d+$/u.test(segments[2]) || /^\d+$/u.test(segments[3]));
        };

        const indexHistoricalCharges = (charges: readonly RecurringChargeInterface[]) => {
            const history = new Map<string, (readonly [number, number])[]>();
            for (const charge of charges) {
                const indexedCharge = [charge.transactionId, startOfDay(charge.operatedAt).getTime()] as const;
                for (const label of new Set([
                    legacyLabel(charge),
                    normalizeRecurringDescription(isNotEmptyString(charge.title) ? charge.title : charge.comment)
                ])) {
                    const key = `${charge.kind}|${label}`;
                    const matching = history.get(key) ?? [];
                    matching.push(indexedCharge);
                    history.set(key, matching);
                }
            }

            return history;
        };

        const matchesHistoricalCadence = (
            series: RecurringSeriesInterface,
            row: RecurringSeriesEntityInterface,
            charges: readonly (readonly [number, number])[]
        ): boolean => {
            if (!isDefined(series.periodMonths) || isQualifiedIdentity(row.merchantKey)) {
                return false;
            }
            const events = series.events.filter(event => differenceInCalendarDays(new Date(event.timestamp), row.lastSeenAt) <= 0);
            const savedDay = startOfDay(row.lastSeenAt).getTime();
            const history = charges.filter(([, day]) => day <= savedDay);
            const eventIds = new Set(events.map(event => event.transactionId));
            if (
                events.length < (series.periodMonths === 12 ? 2 : 3) ||
                history.length !== events.length ||
                !history.every(([transactionId]) => eventIds.has(transactionId)) ||
                differenceInCalendarDays(new Date(events[events.length - 1].timestamp), row.lastSeenAt) !== 0
            ) {
                return false;
            }
            const gaps = events
                .slice(1)
                .map((event, index) => differenceInCalendarDays(new Date(event.timestamp), new Date(events[index].timestamp)))
                .sort((first, second) => first - second);
            const middle = Math.floor(gaps.length / 2);

            return (
                row.periodDays === Math.round(gaps.length % 2 === 1 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2) &&
                events.slice(1).every((event, index) => {
                    const cycle = nearestCycle(new Date(event.timestamp), new Date(events[index].timestamp), series);

                    return cycle.cycle === 1 && cycle.deviation <= series.toleranceDays;
                })
            );
        };

        const createCycleMatcher = (charges: readonly RecurringChargeInterface[]) => {
            let historicalIndex: ReturnType<typeof indexHistoricalCharges> | undefined;
            const matchingHistory = new Map<RecurringSeriesInterface, (readonly [number, number])[]>();
            const cycleMatches = new Map<RecurringSeriesInterface, Map<number, boolean>>();
            const getHistory = (series: RecurringSeriesInterface) => {
                let history = matchingHistory.get(series);
                if (!isDefined(history)) {
                    historicalIndex ??= indexHistoricalCharges(charges);
                    history = [...new Set(series.labels.flatMap(label => historicalIndex?.get(`${series.kind}|${label}`) ?? []))];
                    matchingHistory.set(series, history);
                }

                return history;
            };

            return (series: RecurringSeriesInterface, row: RecurringSeriesEntityInterface): boolean => {
                const matches = cycleMatches.get(series) ?? new Map<number, boolean>();
                const cached = matches.get(row.id);
                if (isDefined(cached)) {
                    return cached;
                }
                const result =
                    row.kind === series.kind &&
                    (row.periodDays === Math.round(series.periodDays) ||
                        (!isQualifiedIdentity(row.merchantKey) &&
                            isDefined(series.periodMonths) &&
                            matchesHistoricalCadence(series, row, getHistory(series)))) &&
                    nearestCycle(new Date(series.anchorTimestamp), row.lastSeenAt, series).deviation <= series.toleranceDays;
                matches.set(row.id, result);
                cycleMatches.set(series, matches);

                return result;
            };
        };

        const canonicalFamily = (key: string): string => {
            const segments = key.split('|');

            return /^\d*$/u.test(segments[2] ?? '') && segments.length >= 4
                ? [segments[0], segments[1], segments[3]].join('|')
                : segments.slice(0, 3).join('|');
        };

        const matchesUnbandedIdentity = (series: RecurringSeriesInterface, row: RecurringSeriesEntityInterface): boolean =>
            !isQualifiedIdentity(row.merchantKey) &&
            series.kind === row.kind &&
            (row.merchantKey.includes('|')
                ? canonicalFamily(row.merchantKey) === canonicalFamily(series.merchantKey)
                : series.labels.includes(row.merchantKey) || series.labels.includes(normalizeRecurringDescription(row.merchantKey)));

        const amountGap = (series: RecurringSeriesInterface, row: RecurringSeriesEntityInterface): number =>
            Math.abs(row.amount - series.predictedAmount);

        const track = Effect.fn('RecurringService.track')(function* (
            detected: readonly RecurringSeriesInterface[],
            charges: readonly RecurringChargeInterface[],
            now: Date
        ) {
            const rows = yield* recurringRepository.findSeries();
            const exactRows = detected.map(series =>
                rows.find(
                    item =>
                        isQualifiedIdentity(item.merchantKey) &&
                        item.kind === series.kind &&
                        item.merchantKey === series.merchantKey &&
                        item.periodDays === Math.round(series.periodDays)
                )
            );
            const claimed = new Set(exactRows.filter(isDefined).map(item => item.id));
            const matchesCycle = createCycleMatcher(charges);

            const qualifiedCandidates = detected.map((series, index) =>
                isDefined(exactRows[index])
                    ? []
                    : rows
                          .filter(
                              item =>
                                  !claimed.has(item.id) &&
                                  isQualifiedIdentity(item.merchantKey) &&
                                  canonicalFamily(item.merchantKey) === canonicalFamily(series.merchantKey) &&
                                  matchesCycle(series, item)
                          )
                          .sort((first, second) => amountGap(series, first) - amountGap(series, second))
            );
            const qualifiedRows = qualifiedCandidates.map(([best, runnerUp], index) => {
                if (
                    !isDefined(best) ||
                    (isDefined(runnerUp) && amountGap(detected[index], runnerUp) === amountGap(detected[index], best)) ||
                    qualifiedCandidates.some(
                        (candidates, candidateIndex) =>
                            candidateIndex !== index &&
                            candidates.includes(best) &&
                            amountGap(detected[candidateIndex], best) <= amountGap(detected[index], best)
                    )
                ) {
                    return null;
                }

                return best;
            });
            for (const row of qualifiedRows.filter(isDefined)) {
                claimed.add(row.id);
            }

            return yield* Effect.forEach(detected, (series, index) => {
                const facts = toFacts(series, now);
                const qualifiedRow = exactRows[index] ?? qualifiedRows[index];
                const unbandedRows = isDefined(qualifiedRow)
                    ? []
                    : rows.filter(item => !claimed.has(item.id) && matchesUnbandedIdentity(series, item) && matchesCycle(series, item));
                const row =
                    qualifiedRow ??
                    unbandedRows.find(
                        item =>
                            unbandedRows.length === 1 &&
                            detected.filter(candidate => matchesUnbandedIdentity(candidate, item) && matchesCycle(candidate, item))
                                .length === 1
                    ) ??
                    null;
                if (isDefined(row)) {
                    claimed.add(row.id);
                }

                return Effect.map(store(series, row, facts), ({ id, userState, title }): RecurringTrackedSeriesInterface => ({
                    ...series,
                    seriesId: id,
                    userState,
                    title
                }));
            });
        });

        return {
            calendar: Effect.fn('RecurringService.calendar')(function* (year: number, month: number, now: Date) {
                const { defaultInstrumentId, language } = yield* settingsRepository.getSettings();
                const since = new Date(now.getFullYear(), now.getMonth() - HISTORY_MONTHS, now.getDate());
                const charges = yield* recurringRepository.findCharges(defaultInstrumentId, language, since);
                const historicalCharges = yield* recurringRepository.findHistoricalCharges(defaultInstrumentId, language, since);
                const tracked = yield* Db.transaction(track(detectRecurringSeries(charges), historicalCharges, now));

                return projectRecurringMonth(tracked, year, month, now);
            }),
            setUserState: (seriesId: number, userState: RecurringSeriesUserStateEnum) =>
                recurringRepository.updateSeries(seriesId, { userState }),
            rename: (seriesId: number, title: string) => recurringRepository.updateSeries(seriesId, { title })
        };
    })
}) {
    static readonly layer = Layer.effect(RecurringService, RecurringService.make).pipe(
        Layer.provide([RecurringRepository.layer, SettingsRepository.layer])
    );
}
