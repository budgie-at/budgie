import { PRECISION } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { RECURRING_ACTIVE_CONFIDENCE } from '../constant/recurring-active-confidence.constant';
import { CADENCES } from '../constant/recurring-cadences.constant';

import { calendarDay, nearestCycle } from './recurring-schedule';

import type { RecurringCadenceInterface } from '../interface/recurring-cadence.interface';
import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringStreamContextInterface } from '../interface/recurring-stream-context.interface';
import type { RecurringStreamInterface } from '../interface/recurring-stream.interface';

const RESTART_PERIODS = 2;
const ANCHOR_CANDIDATES = 6;
const FIXED_PURITY = 0.75;
const VARIABLE_PURITY = 0.8;
const JITTERY_PURITY = 0.9;
const MINIMUM_COVERAGE = 0.75;
const JITTERY_COVERAGE = 0.85;
const GAP_FREE_CYCLES = 5;
const VARIABLE_AMOUNT_RATIO = 10;
const EXACT_AMOUNT_RATIO = 1.02;
const EXACT_SPREAD = 0.1;
const BUSY_MERCHANT_RATIO = 3;
const YEARLY_MONTHS = 12;
const MINIMUM_CYCLES = 3;
const MINIMUM_YEARLY_CYCLES = 2;
const MINIMUM_JITTERY_CYCLES = 4;
const EXTRA_CYCLES = 6;
const POSSIBLE_CONFIDENCE = 30;
const POSSIBLE_RANGE = RECURRING_ACTIVE_CONFIDENCE - POSSIBLE_CONFIDENCE - 1;
const ACTIVE_RANGE = 100 - RECURRING_ACTIVE_CONFIDENCE;
const EXTRA_WEIGHT = 0.3;
const COVERAGE_WEIGHT = 0.2;
const REGULARITY_WEIGHT = 0.2;
const EXACTNESS_WEIGHT = 0.2;
const IBAN_WEIGHT = 0.1;

const clampUnit = (value: number): number => Math.min(1, Math.max(0, value));

export const median = (values: readonly number[]): number => {
    const sorted = [...values].sort((first, second) => first - second);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const currentRun = (events: readonly RecurringSeriesEventInterface[], cadence: RecurringCadenceInterface) => {
    const restartIndex = events.findLastIndex(
        (event, index) =>
            index > 0 &&
            calendarDay(new Date(event.timestamp)) - calendarDay(new Date(events[index - 1].timestamp)) >
                cadence.periodDays * RESTART_PERIODS + cadence.toleranceDays
    );

    return events.slice(Math.max(0, restartIndex));
};

const jitteryCycles = (cadence: RecurringCadenceInterface, isVariable: boolean): number | null =>
    isVariable ? cadence.jitteryVariableCycles : cadence.jitteryFixedCycles;

const fitWindowDays = (cadence: RecurringCadenceInterface, isVariable: boolean): number =>
    isDefined(jitteryCycles(cadence, isVariable)) ? cadence.windowDays : cadence.toleranceDays;

const placeEvents = (events: readonly RecurringSeriesEventInterface[], anchorTimestamp: number, cadence: RecurringCadenceInterface) => {
    const anchor = new Date(anchorTimestamp);

    return events.map(event => ({ event, ...nearestCycle(anchor, new Date(event.timestamp), cadence) }));
};

const pickAnchor = (run: readonly RecurringSeriesEventInterface[], cadence: RecurringCadenceInterface, isVariable: boolean): number => {
    const candidates = run.slice(-ANCHOR_CANDIDATES);

    return candidates
        .map(candidate => {
            const deviations = placeEvents(candidates, candidate.timestamp, cadence)
                .map(placed => placed.deviation)
                .filter(deviation => deviation <= fitWindowDays(cadence, isVariable));

            return {
                timestamp: candidate.timestamp,
                onTime: deviations.filter(deviation => deviation <= cadence.toleranceDays).length,
                inWindow: deviations.length,
                deviation: deviations.reduce((total, deviation) => total + deviation, 0)
            };
        })
        .reduce((best, candidate) =>
            (candidate.onTime - best.onTime || candidate.inWindow - best.inWindow || best.deviation - candidate.deviation) >= 0
                ? candidate
                : best
        ).timestamp;
};

const acceptEvents = (
    run: readonly RecurringSeriesEventInterface[],
    anchorTimestamp: number,
    cadence: RecurringCadenceInterface,
    isVariable: boolean
) => {
    const placed = placeEvents(run, anchorTimestamp, cadence);
    const inWindow = placed.filter(item => item.deviation <= fitWindowDays(cadence, isVariable));
    const typicalAmount = median(inWindow.map(item => item.event.nativeAmount));
    const bestByCycle = new Map<number, (typeof placed)[number]>();
    for (const item of inWindow) {
        const current = bestByCycle.get(item.cycle);
        const isTypical =
            !isVariable ||
            (item.event.nativeAmount * VARIABLE_AMOUNT_RATIO >= typicalAmount &&
                item.event.nativeAmount <= typicalAmount * VARIABLE_AMOUNT_RATIO);
        if (isTypical && (!isDefined(current) || item.deviation <= current.deviation)) {
            bestByCycle.set(item.cycle, item);
        }
    }

    return placed.map(item => ({ ...item, isAccepted: bestByCycle.get(item.cycle) === item }));
};

const longestStream = (placed: ReturnType<typeof acceptEvents>, purity: number, coverage: number): ReturnType<typeof acceptEvents> => {
    const latestIndex = placed.findLastIndex(item => item.isAccepted);
    const latest = placed.at(latestIndex);
    if (!isDefined(latest) || !latest.isAccepted || placed.slice(latestIndex + 1).some(item => item.cycle !== latest.cycle)) {
        return [];
    }
    let accepted = 0;
    let outliers = placed.length - 1 - latestIndex;
    let start = placed.length;
    let isCycleAccepted = false;
    for (let index = latestIndex; index >= 0; index -= 1) {
        const item = placed[index];
        isCycleAccepted = (index < latestIndex && placed[index + 1].cycle === item.cycle && isCycleAccepted) || item.isAccepted;
        accepted += Number(item.isAccepted);
        outliers += Number(!item.isAccepted);
        const spannedCycles = item.cycle - latest.cycle + 1;
        const isValid =
            placed[index - 1]?.cycle !== item.cycle &&
            isCycleAccepted &&
            accepted / (accepted + outliers) >= purity &&
            accepted / spannedCycles >= coverage &&
            (accepted >= GAP_FREE_CYCLES || accepted === spannedCycles);
        start = isValid ? index : start;
    }

    return placed.slice(start).filter(item => item.isAccepted);
};

const isJittery = (stream: ReturnType<typeof acceptEvents>, cadence: RecurringCadenceInterface): boolean =>
    stream.some(item => item.deviation > cadence.toleranceDays);

const requiredCycles = (
    stream: ReturnType<typeof acceptEvents>,
    anchorTimestamp: number,
    cadence: RecurringCadenceInterface,
    context: RecurringStreamContextInterface
) => {
    const amounts = stream.map(item => item.event.nativeAmount);
    const first = stream[0].event.timestamp;
    const last = stream[stream.length - 1].event.timestamp;
    const isBusy =
        placeEvents(
            context.merchantEvents.filter(event => event.timestamp >= first && event.timestamp <= last),
            anchorTimestamp,
            cadence
        ).filter(item => item.deviation > cadence.toleranceDays).length >=
        BUSY_MERCHANT_RATIO * stream.length;
    const isLoose = context.isVariable || isBusy;
    const isExact =
        Math.max(...amounts) <= Math.min(...amounts) * EXACT_AMOUNT_RATIO &&
        Math.max(...stream.map(item => item.deviation)) <= Math.ceil(cadence.toleranceDays / 2);
    const isYearly = cadence.periodMonths === YEARLY_MONTHS;
    const jittery = isJittery(stream, cadence) ? jitteryCycles(cadence, context.isVariable) : null;
    const discount = Number(!isDefined(jittery) && !isLoose && (isExact || context.hasIban));
    const activeCycles = Math.max(
        isYearly ? MINIMUM_YEARLY_CYCLES : MINIMUM_CYCLES,
        (jittery ?? (isLoose ? cadence.variableCycles : cadence.fixedCycles)) - discount
    );

    const minimumPossible = Math.max(
        isYearly && !isLoose ? MINIMUM_YEARLY_CYCLES : MINIMUM_CYCLES,
        isDefined(jittery) ? MINIMUM_JITTERY_CYCLES : 0
    );

    return { activeCycles, possibleCycles: Math.min(activeCycles, Math.max(minimumPossible, activeCycles - 1)) };
};

const scoreStream = (
    stream: ReturnType<typeof acceptEvents>,
    anchorTimestamp: number,
    cadence: RecurringCadenceInterface,
    context: RecurringStreamContextInterface
): number | null => {
    if (stream.length < MINIMUM_YEARLY_CYCLES) {
        return null;
    }
    const amounts = stream.map(item => item.event.nativeAmount);
    const meanDeviation = stream.reduce((total, item) => total + item.deviation, 0) / stream.length;
    const { activeCycles, possibleCycles } = requiredCycles(stream, anchorTimestamp, cadence, context);
    const isActive = stream.length >= activeCycles && (stream.length > MINIMUM_YEARLY_CYCLES || context.isIsolatedPair);
    if (
        stream.length < possibleCycles ||
        (context.isVariable && meanDeviation > (isJittery(stream, cadence) ? cadence.windowDays : cadence.toleranceDays) / 2) ||
        (!isActive && stream.length === MINIMUM_CYCLES && stream.some(item => item.deviation >= cadence.toleranceDays))
    ) {
        return null;
    }
    const coverage = stream.length / (stream[0].cycle - stream[stream.length - 1].cycle + 1);
    const quality =
        EXTRA_WEIGHT * clampUnit((stream.length - activeCycles) / EXTRA_CYCLES) +
        COVERAGE_WEIGHT * clampUnit((coverage - MINIMUM_COVERAGE) / (1 - MINIMUM_COVERAGE)) +
        REGULARITY_WEIGHT * clampUnit(1 - meanDeviation / cadence.toleranceDays) +
        EXACTNESS_WEIGHT *
            (context.isVariable ? 0 : clampUnit(1 - (Math.max(...amounts) / Math.max(Math.min(...amounts), 1) - 1) / EXACT_SPREAD)) +
        IBAN_WEIGHT * Number(context.hasIban);

    return isActive
        ? RECURRING_ACTIVE_CONFIDENCE + Math.round(ACTIVE_RANGE * quality)
        : POSSIBLE_CONFIDENCE + Math.round(POSSIBLE_RANGE * quality);
};

const finerCadence = (cadence: RecurringCadenceInterface): RecurringCadenceInterface | undefined =>
    CADENCES.find(
        candidate => candidate.periodDays * 2 <= cadence.periodDays && (candidate.periodMonths === 1 || !isDefined(cadence.periodMonths))
    );

const isHarmonic = (
    stream: ReturnType<typeof acceptEvents>,
    anchorTimestamp: number,
    cadence: RecurringCadenceInterface,
    merchantEvents: readonly RecurringSeriesEventInterface[]
): boolean => {
    const finer = finerCadence(cadence);
    const first = stream.at(0);
    const last = stream.at(-1);
    if (!isDefined(finer) || !isDefined(first) || !isDefined(last)) {
        return false;
    }
    const [firstSlot, lastSlot] = placeEvents([first.event, last.event], anchorTimestamp, finer).map(item => item.cycle);
    const filledSlots = new Set(
        placeEvents(merchantEvents, anchorTimestamp, finer)
            .filter(item => item.deviation <= finer.toleranceDays && item.cycle <= firstSlot && item.cycle >= lastSlot)
            .map(item => item.cycle)
    );

    return filledSlots.size / (firstSlot - lastSlot + 1) >= MINIMUM_COVERAGE;
};

const fitCadence = (
    events: readonly RecurringSeriesEventInterface[],
    cadence: RecurringCadenceInterface,
    context: RecurringStreamContextInterface
): RecurringStreamInterface | null => {
    const run = currentRun(events, cadence);
    const anchorTimestamp = pickAnchor(run, cadence, context.isVariable);
    const placed = acceptEvents(run, anchorTimestamp, cadence, context.isVariable);
    const purity = context.isVariable ? VARIABLE_PURITY : FIXED_PURITY;
    const loose = longestStream(placed, purity, MINIMUM_COVERAGE);
    const stream = isJittery(loose, cadence) ? longestStream(placed, JITTERY_PURITY, JITTERY_COVERAGE) : loose;
    const confidence = scoreStream(stream, anchorTimestamp, cadence, context);

    return isDefined(confidence) && !isHarmonic(stream, anchorTimestamp, cadence, context.merchantEvents)
        ? { cadence, anchorTimestamp, confidence, events: stream.map(item => item.event) }
        : null;
};

export const fitRecurringStream = (
    events: readonly RecurringSeriesEventInterface[],
    context: RecurringStreamContextInterface
): RecurringStreamInterface | null => {
    if (events.length < MINIMUM_YEARLY_CYCLES) {
        return null;
    }
    for (const cadence of CADENCES) {
        const stream = fitCadence(events, cadence, context);
        if (isDefined(stream)) {
            return median(stream.events.map(event => event.defaultAmount)) >= PRECISION ? stream : null;
        }
    }

    return null;
};
