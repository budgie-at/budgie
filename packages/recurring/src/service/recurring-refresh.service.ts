import {
    Db,
    RecurringMatchSourceEnum,
    RecurringSeriesSourceEnum,
    RecurringSeriesStatusEnum,
    RecurringSeriesUserStateEnum,
    SettingsRepository
} from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';
import { subDays } from 'date-fns/subDays';
import { subMonths } from 'date-fns/subMonths';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Semaphore from 'effect/Semaphore';

import { isDefined } from '@rnw-community/shared';

import { RECURRING_AMOUNT_RATIO } from '../constant/recurring-amount-ratio.constant';
import { RECURRING_HISTORY_MONTHS } from '../constant/recurring-history-months.constant';
import { RECURRING_TRACKED_KINDS } from '../constant/recurring-tracked-kinds.constant';
import { RecurringAdoptionEnum } from '../enum/recurring-adoption.enum';
import { RecurringRepository } from '../repository/recurring.repository';
import { resolveKeyedRows } from '../series/recurring-adoption';
import { scoreDetectedSeries } from '../series/recurring-confidence';
import { buildDetectedSchedule } from '../series/recurring-detected-schedule';
import { matchRecurringTransactions } from '../series/recurring-matcher';
import { cadencePeriodDays, cadenceToleranceDays, nearestCycleDate } from '../series/recurring-schedule';
import { detectRecurringSeries, identity, isSeriesActive, nearestCycle } from '../series/recurring-series';
import { chargeKey } from '../utils/charge-key.util';

import type { RecurringChargeInterface } from '../interface/recurring-charge.interface';
import type { RecurringMatchSeriesInterface } from '../interface/recurring-match-series.interface';
import type { RecurringSeriesRowInterface } from '../interface/recurring-series-row.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';
import type {
    LanguageEnum,
    RecurringSeriesCreateEntityInterface,
    RecurringSeriesEntityInterface,
    RecurringSeriesTransactionCreateEntityInterface,
    RecurringSeriesTransactionEntityInterface
} from '@budgie/contracts';

export class RecurringRefreshService extends Context.Service<RecurringRefreshService>()('@budgie/recurring/RecurringRefreshService', {
    make: Effect.gen(function* () {
        const MATCH_WINDOW_DAYS = 60;
        const FULL_DETECTION_INTERVAL_MS = 86_400_000;
        const valuesEqual = (first: unknown, second: unknown): boolean =>
            first instanceof Date && second instanceof Date ? first.getTime() === second.getTime() : first === second;

        const isUserOwned = (row: RecurringSeriesEntityInterface): boolean =>
            row.source === RecurringSeriesSourceEnum.MANUAL || row.userState === RecurringSeriesUserStateEnum.CONFIRMED;

        const STREAM_PERIOD_RATIO = 1.25;
        const VARIABLE_CHARGE_COUNT = 3;

        const isSameStream = (owner: RecurringSeriesEntityInterface, series: RecurringSeriesInterface): boolean => {
            if (isUserOwned(owner)) {
                const ownerPeriod = cadencePeriodDays(owner);

                return Math.max(ownerPeriod, series.periodDays) <= Math.min(ownerPeriod, series.periodDays) * STREAM_PERIOD_RATIO;
            }
            const schedule = buildDetectedSchedule(series);

            return owner.cadenceUnit === schedule.cadenceUnit && owner.cadenceInterval === schedule.cadenceInterval;
        };

        const resolveAdoption = (isAdopted: boolean, isKeyed: boolean): RecurringAdoptionEnum => {
            if (isAdopted) {
                return RecurringAdoptionEnum.ADOPTED;
            }

            return isKeyed ? RecurringAdoptionEnum.KEYED : RecurringAdoptionEnum.NONE;
        };

        const pairKey = (seriesId: number, value: number): string => `${seriesId}:${value}`;

        const recurringRepository = yield* RecurringRepository;
        const settingsRepository = yield* SettingsRepository;
        const permit = yield* Semaphore.make(1);
        const lastDetectionAt = yield* Ref.make<number | null>(null);
        const initialPermit = yield* Semaphore.make(1);
        const isInitialDone = yield* Ref.make(false);

        const loadLinkedCharges = Effect.fnUntraced(function* (defaultInstrumentId: number | null, language: LanguageEnum) {
            const charges = yield* recurringRepository.findLinkedCharges(defaultInstrumentId, language);

            return new Map(charges.map(charge => [chargeKey(charge.kind, charge.transactionId), charge]));
        });

        const dropInvalidLinks = Effect.fnUntraced(function* (
            rows: readonly RecurringSeriesEntityInterface[],
            links: readonly RecurringSeriesTransactionEntityInterface[],
            linkedCharges: ReadonlyMap<string, RecurringChargeInterface>
        ) {
            const rowById = new Map(rows.map(row => [row.id, row]));
            const invalid = links.filter(link => {
                const row = rowById.get(link.seriesId);
                const charge = isDefined(row) ? linkedCharges.get(chargeKey(row.kind, link.transactionId)) : null;

                return (
                    link.matchedBy === RecurringMatchSourceEnum.AUTO &&
                    !link.isExcluded &&
                    (!isDefined(row) ||
                        !isDefined(charge) ||
                        Math.abs(differenceInCalendarDays(charge.operatedAt, link.cycleDate)) > cadenceToleranceDays(row))
                );
            });
            const deletedAt = yield* DateTime.nowAsDate;
            yield* recurringRepository.setLinksDeletedAt(
                invalid.map(link => link.id),
                deletedAt
            );

            return new Set(invalid.map(link => link.id));
        });

        const observedFacts = (series: RecurringSeriesInterface, now: Date) => ({
            amount: series.nativeAmount,
            instrumentId: series.instrumentId,
            status: isSeriesActive(series, now) ? RecurringSeriesStatusEnum.ACTIVE : RecurringSeriesStatusEnum.ENDED,
            lastSeenAt: new Date(series.anchorTimestamp),
            confidence: scoreDetectedSeries(series)
        });

        const structuralFacts = (series: RecurringSeriesInterface) => ({
            kind: series.kind,
            categoryId: series.categoryId,
            ...buildDetectedSchedule(series)
        });

        const identityFacts = (series: RecurringSeriesInterface) => ({
            merchantKey: series.merchantKey,
            periodDays: Math.round(series.periodDays)
        });

        const store = Effect.fnUntraced(function* (
            series: RecurringSeriesInterface,
            row: RecurringSeriesEntityInterface | null,
            adoption: RecurringAdoptionEnum,
            now: Date
        ) {
            if (!isDefined(row)) {
                const input: RecurringSeriesCreateEntityInterface = {
                    ...observedFacts(series, now),
                    ...structuralFacts(series),
                    ...identityFacts(series),
                    title: series.title,
                    userState: RecurringSeriesUserStateEnum.SUGGESTED,
                    source: RecurringSeriesSourceEnum.DETECTED
                };

                return yield* recurringRepository.createSeries(input);
            }
            if (row.source === RecurringSeriesSourceEnum.MANUAL) {
                return row;
            }
            const facts =
                row.userState === RecurringSeriesUserStateEnum.CONFIRMED
                    ? {
                          ...observedFacts(series, now),
                          ...(adoption !== RecurringAdoptionEnum.NONE && { merchantKey: series.merchantKey }),
                          ...(adoption === RecurringAdoptionEnum.ADOPTED && { ...identityFacts(series), ...buildDetectedSchedule(series) })
                      }
                    : { ...observedFacts(series, now), ...structuralFacts(series), ...identityFacts(series) };
            const current = new Map(Object.entries(row));

            return Object.entries(facts).every(([key, value]) => valuesEqual(current.get(key), value))
                ? row
                : yield* recurringRepository.updateSeries(row.id, facts);
        });

        const detectInTransaction = Effect.fnUntraced(function* (now: Date, defaultInstrumentId: number | null, language: LanguageEnum) {
            const rows = yield* recurringRepository.findAllSeries;
            const linkedCharges = yield* loadLinkedCharges(defaultInstrumentId, language);
            const storedLinks = yield* recurringRepository.findLinks;
            const everLinkedSeriesIds = yield* recurringRepository.findEverLinkedSeriesIds;
            const droppedIds = yield* dropInvalidLinks(rows, storedLinks, linkedCharges);
            const links = storedLinks.filter(link => !droppedIds.has(link.id));
            const liveLinks = links.filter(link => !link.isExcluded);
            const liveByTransaction = new Map(liveLinks.map(link => [link.transactionId, link.seriesId]));
            const excludedPairs = new Set(links.filter(link => link.isExcluded).map(link => pairKey(link.seriesId, link.transactionId)));
            const excludedOnly = new Set(
                links.filter(link => link.isExcluded && !liveByTransaction.has(link.transactionId)).map(link => link.transactionId)
            );
            const occupied = new Set(liveLinks.map(link => pairKey(link.seriesId, link.cycleDate.getTime())));
            const since = subMonths(now, RECURRING_HISTORY_MONTHS);
            const charges = (yield* Effect.forEach(RECURRING_TRACKED_KINDS, kind =>
                recurringRepository.findCharges(defaultInstrumentId, language, since, kind)
            ))
                .flat()
                .filter(charge => !excludedOnly.has(charge.transactionId));
            const detected = detectRecurringSeries(charges);

            const rowById = new Map(rows.map(row => [row.id, row]));
            const overlaps = detected.map(series => {
                const counts = new Map<number, number>();
                for (const event of series.events) {
                    const seriesId = liveByTransaction.get(event.transactionId);
                    const owner = isDefined(seriesId) ? rowById.get(seriesId) : null;
                    if (
                        isDefined(owner) &&
                        isSameStream(owner, series) &&
                        nearestCycle(new Date(series.anchorTimestamp), new Date(event.timestamp), series).deviation <= series.toleranceDays
                    ) {
                        counts.set(owner.id, (counts.get(owner.id) ?? 0) + 1);
                    }
                }

                return [...counts.entries()].sort(([firstId, first], [secondId, second]) => second - first || firstId - secondId)[0];
            });
            const claimed = new Set<number>();
            const resolved = new Map<number, RecurringSeriesEntityInterface>();
            const overlapIndexes = new Set<number>();
            for (const index of detected
                .map((_, candidateIndex) => candidateIndex)
                .sort((first, second) => (overlaps[second]?.[1] ?? 0) - (overlaps[first]?.[1] ?? 0) || first - second)) {
                const overlap = overlaps[index];
                const row = isDefined(overlap) ? rowById.get(overlap[0]) : null;
                if (isDefined(row) && !claimed.has(row.id)) {
                    claimed.add(row.id);
                    resolved.set(index, row);
                    overlapIndexes.add(index);
                }
            }

            const linkedSeriesIds = new Set(liveLinks.map(link => link.seriesId));
            const adoptableRows = rows.filter(row => row.source === RecurringSeriesSourceEnum.DETECTED && !claimed.has(row.id));
            const zeroLinkRowIds = new Set(adoptableRows.filter(row => !linkedSeriesIds.has(row.id)).map(row => row.id));
            const historicalCharges =
                zeroLinkRowIds.size > 0
                    ? (yield* Effect.forEach(RECURRING_TRACKED_KINDS, kind =>
                          recurringRepository.findHistoricalCharges(defaultInstrumentId, language, since, kind)
                      )).flat()
                    : [];
            const unresolvedIndexes = detected.map((_, index) => index).filter(index => !resolved.has(index));
            const keyedRows = resolveKeyedRows(
                unresolvedIndexes.map(index => detected[index]),
                adoptableRows,
                historicalCharges,
                zeroLinkRowIds
            );
            const keyedIndexes = new Set<number>();
            unresolvedIndexes.forEach((detectedIndex, keyedIndex) => {
                const row = keyedRows[keyedIndex];
                if (isDefined(row)) {
                    resolved.set(detectedIndex, row);
                    keyedIndexes.add(detectedIndex);
                }
            });

            const linkInputs: RecurringSeriesTransactionCreateEntityInterface[] = [];
            const correctedScheduleIds = new Set(
                rows
                    .filter(
                        row =>
                            isUserOwned(row) &&
                            liveLinks.some(
                                link =>
                                    link.seriesId === row.id &&
                                    nearestCycleDate(row, link.cycleDate).deviationDays > cadenceToleranceDays(row)
                            )
                    )
                    .map(row => row.id)
            );
            const isOwnedByUser = (series: RecurringSeriesInterface): boolean =>
                series.events.filter(event => {
                    const owner = rowById.get(liveByTransaction.get(event.transactionId) ?? 0);

                    return isDefined(owner) && isUserOwned(owner) && (isSameStream(owner, series) || correctedScheduleIds.has(owner.id));
                }).length >
                series.events.length / 2;
            const storable = [...detected.entries()].filter(([index, series]) => resolved.has(index) || !isOwnedByUser(series));
            for (const [index, series] of storable) {
                const matchedRow = resolved.get(index) ?? null;
                const isAdopted = isDefined(matchedRow) && !overlapIndexes.has(index) && !everLinkedSeriesIds.has(matchedRow.id);
                const stored = yield* store(series, matchedRow, resolveAdoption(isAdopted, keyedIndexes.has(index)), now);
                for (const event of series.events) {
                    const date = startOfDay(event.timestamp);
                    const cycle = nearestCycleDate(stored, date);
                    const isFree =
                        !liveByTransaction.has(event.transactionId) &&
                        !excludedPairs.has(pairKey(stored.id, event.transactionId)) &&
                        !occupied.has(pairKey(stored.id, cycle.cycleDate.getTime())) &&
                        cycle.deviationDays <= cadenceToleranceDays(stored);
                    if (isFree) {
                        occupied.add(pairKey(stored.id, cycle.cycleDate.getTime()));
                        liveByTransaction.set(event.transactionId, stored.id);
                        linkInputs.push({
                            seriesId: stored.id,
                            transactionId: event.transactionId,
                            cycleDate: cycle.cycleDate,
                            matchedBy: RecurringMatchSourceEnum.AUTO
                        });
                    }
                }
            }
            yield* recurringRepository.upsertAutoLinks(linkInputs);
        });

        const buildMatchSeries = (
            rows: readonly RecurringSeriesRowInterface[],
            links: readonly RecurringSeriesTransactionEntityInterface[],
            linkedCharges: ReadonlyMap<string, RecurringChargeInterface>
        ): RecurringMatchSeriesInterface[] =>
            rows
                .filter(
                    row =>
                        row.source === RecurringSeriesSourceEnum.MANUAL || links.some(link => link.seriesId === row.id && !link.isExcluded)
                )
                .map(row => {
                    const rowLinks = links.filter(link => link.seriesId === row.id);

                    const amounts = rowLinks
                        .filter(link => !link.isExcluded)
                        .map(link => linkedCharges.get(chargeKey(row.kind, link.transactionId)))
                        .filter(isDefined)
                        .sort((first, second) => second.operatedAt.getTime() - first.operatedAt.getTime())
                        .slice(0, VARIABLE_CHARGE_COUNT)
                        .map(charge => charge.nativeAmount);

                    return {
                        isVariable: amounts.length > 1 && Math.max(...amounts) > Math.min(...amounts) * RECURRING_AMOUNT_RATIO,
                        series: row,
                        userIdentities: new Set(
                            rowLinks
                                .filter(link => link.matchedBy === RecurringMatchSourceEnum.USER && !link.isExcluded)
                                .map(link => linkedCharges.get(chargeKey(row.kind, link.transactionId)))
                                .filter(isDefined)
                                .map(charge => identity(charge))
                        ),
                        occupiedCycles: new Set(rowLinks.filter(link => !link.isExcluded).map(link => link.cycleDate.getTime())),
                        excludedTransactionIds: new Set(rowLinks.filter(link => link.isExcluded).map(link => link.transactionId))
                    };
                });

        const matchInTransaction = Effect.fnUntraced(function* (now: Date, defaultInstrumentId: number | null, language: LanguageEnum) {
            const since = subDays(now, MATCH_WINDOW_DAYS);
            const rows = yield* recurringRepository.findSeriesRows(defaultInstrumentId, language);
            const links = yield* recurringRepository.findLinks;
            const linkedCharges = yield* loadLinkedCharges(defaultInstrumentId, language);
            const linkedTransactions = new Set(links.filter(link => !link.isExcluded).map(link => link.transactionId));
            const candidates = (yield* Effect.forEach(RECURRING_TRACKED_KINDS, kind =>
                recurringRepository.findHistoricalCharges(defaultInstrumentId, language, since, kind)
            ))
                .flat()
                .filter(charge => !linkedTransactions.has(charge.transactionId));
            const matches = matchRecurringTransactions(candidates, buildMatchSeries(rows, links, linkedCharges));
            yield* recurringRepository.upsertAutoLinks(
                matches.map(match => ({
                    seriesId: match.seriesId,
                    transactionId: match.transactionId,
                    cycleDate: match.cycleDate,
                    matchedBy: RecurringMatchSourceEnum.AUTO
                }))
            );
            const chargeById = new Map(candidates.map(charge => [charge.transactionId, charge]));
            for (const row of rows) {
                const own = matches.filter(match => match.seriesId === row.id);
                const lastSeen = Math.max(
                    row.lastSeenAt.getTime(),
                    ...own.map(match => chargeById.get(match.transactionId)?.operatedAt.getTime() ?? 0)
                );
                const merchantKey = own.find(match => isDefined(match.merchantKey))?.merchantKey;
                const isSeenLater = row.source === RecurringSeriesSourceEnum.DETECTED && lastSeen > row.lastSeenAt.getTime();
                if (isSeenLater || isDefined(merchantKey)) {
                    yield* recurringRepository.updateSeries(row.id, {
                        ...(isSeenLater && { lastSeenAt: DateTime.toDateUtc(DateTime.makeUnsafe(lastSeen)) }),
                        ...(isDefined(merchantKey) && { merchantKey })
                    });
                }
            }
        });

        const matchRecentUnlocked = Effect.fnUntraced(function* (now: Date) {
            const { defaultInstrumentId, language } = yield* settingsRepository.getSettings();

            return yield* Db.transaction(matchInTransaction(now, defaultInstrumentId, language));
        });

        const detectUnlocked = Effect.fnUntraced(function* (now: Date) {
            const { defaultInstrumentId, language } = yield* settingsRepository.getSettings();
            yield* Db.transaction(detectInTransaction(now, defaultInstrumentId, language));
            yield* Ref.set(lastDetectionAt, now.getTime());
            yield* Ref.set(isInitialDone, true);
        });

        return {
            matchRecent: (now: Date) => permit.withPermits(1)(matchRecentUnlocked(now)),
            refresh: (now: Date) =>
                permit.withPermits(1)(
                    Effect.gen(function* () {
                        yield* matchRecentUnlocked(now);
                        const lastRun = yield* Ref.get(lastDetectionAt);
                        const isDue = !isDefined(lastRun) || now.getTime() - lastRun >= FULL_DETECTION_INTERVAL_MS;

                        if (isDue) {
                            yield* detectUnlocked(now);
                        }
                    })
                ),
            ensureInitial: (now: Date) =>
                isInitialDone.pipe(
                    Ref.get,
                    Effect.flatMap(isDone =>
                        isDone
                            ? Effect.void
                            : matchRecentUnlocked(now).pipe(
                                  permit.withPermits(1),
                                  Effect.andThen(Ref.set(isInitialDone, true)),
                                  Effect.ignore({ log: true })
                              )
                    ),
                    initialPermit.withPermits(1)
                )
        };
    })
}) {
    static readonly layer = Layer.effect(RecurringRefreshService, RecurringRefreshService.make).pipe(
        Layer.provide([RecurringRepository.layer, SettingsRepository.layer])
    );
}
