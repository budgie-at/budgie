import { Db, RecurringSeriesStatusEnum, RecurringSeriesUserStateEnum, SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { RecurringRepository } from '../repository/recurring.repository';
import { projectRecurringMonth } from '../series/recurring-projection';
import { detectRecurringSeries, isSeriesActive, nearestCycle } from '../series/recurring-series';
import { normalizeRecurringDescription } from '../utils/normalize-recurring-description.util';

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

            return row.userState === RecurringSeriesUserStateEnum.DISMISSED || isUnchanged(row, facts)
                ? Effect.succeed(row)
                : recurringRepository.updateSeries(row.id, facts);
        };

        const matchesLegacyIdentity = (series: RecurringSeriesInterface, row: RecurringSeriesEntityInterface): boolean =>
            !row.merchantKey.includes('|') &&
            series.kind === row.kind &&
            (series.labels.includes(row.merchantKey) || series.labels.includes(normalizeRecurringDescription(row.merchantKey)));

        const canonicalFamily = (key: string): string => {
            const segments = key.split('|');

            return /^\d*$/u.test(segments[2] ?? '') && segments.length >= 4
                ? [segments[0], segments[1], segments[3]].join('|')
                : segments.slice(0, 3).join('|');
        };

        const amountGap = (series: RecurringSeriesInterface, row: RecurringSeriesEntityInterface): number =>
            Math.abs(row.amount - series.predictedAmount);

        const track = Effect.fn('RecurringService.track')(function* (detected: readonly RecurringSeriesInterface[], now: Date) {
            const rows = yield* recurringRepository.findSeries();
            const exactRows = detected.map(series =>
                rows.find(item => item.kind === series.kind && item.merchantKey === series.merchantKey)
            );
            const claimed = new Set(exactRows.filter(isDefined).map(item => item.id));

            return yield* Effect.forEach(detected, (series, index) => {
                const facts = toFacts(series, now);
                const legacyRows = rows.filter(item => matchesLegacyIdentity(series, item));
                const [best, runnerUp] = rows
                    .filter(
                        item =>
                            !claimed.has(item.id) &&
                            item.kind === series.kind &&
                            item.periodDays === facts.periodDays &&
                            canonicalFamily(item.merchantKey) === canonicalFamily(series.merchantKey) &&
                            nearestCycle(new Date(series.anchorTimestamp), item.lastSeenAt, series).deviation <= series.toleranceDays
                    )
                    .sort((first, second) => amountGap(series, first) - amountGap(series, second));
                const row =
                    exactRows[index] ??
                    (isDefined(runnerUp) && amountGap(series, runnerUp) === amountGap(series, best) ? null : best) ??
                    legacyRows.find(item => item.userState === RecurringSeriesUserStateEnum.DISMISSED) ??
                    legacyRows.find(
                        item =>
                            legacyRows.length === 1 &&
                            !claimed.has(item.id) &&
                            detected.filter(candidate => matchesLegacyIdentity(candidate, item)).length === 1
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
                const tracked = yield* Db.transaction(track(detectRecurringSeries(charges), now));

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
