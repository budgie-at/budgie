import { addDays } from 'date-fns/addDays';
import { addMonths } from 'date-fns/addMonths';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { nearestCycle } from './recurring-schedule';
import { PRICE_CHANGE_RATIO } from './recurring-series';

import type { RecurringSeriesEventInterface } from '../interface/recurring-series-event.interface';
import type { RecurringSeriesInterface } from '../interface/recurring-series.interface';
import type { RecurringStreamInterface } from '../interface/recurring-stream.interface';

const CONTINUATION_AMOUNT_RATIO = 2;

const hasSameCadence = (previous: RecurringSeriesInterface, next: RecurringSeriesInterface): boolean =>
    previous.kind === next.kind &&
    previous.instrumentId === next.instrumentId &&
    previous.merchantKey !== next.merchantKey &&
    previous.periodMonths === next.periodMonths &&
    previous.periodDays === next.periodDays;

const isWithinPriceChange = (previous: RecurringSeriesInterface, next: RecurringSeriesInterface): boolean =>
    Math.abs(next.nativeAmount - previous.nativeAmount) <= previous.nativeAmount * PRICE_CHANGE_RATIO;

const expectedNextDate = (previous: RecurringSeriesInterface, previousTimestamp: number): Date =>
    isDefined(previous.periodMonths)
        ? addMonths(new Date(previousTimestamp), previous.periodMonths)
        : addDays(new Date(previousTimestamp), previous.periodDays);

const continuesSeries = (previous: RecurringSeriesInterface, next: RecurringSeriesInterface): boolean => {
    const previousEvent = previous.events.at(-1);
    const nextEvent = next.events.at(0);
    if (!isDefined(previousEvent) || !isDefined(nextEvent) || !hasSameCadence(previous, next)) {
        return false;
    }
    const nextDate = new Date(nextEvent.timestamp);
    const gapDays = differenceInCalendarDays(nextDate, new Date(previousEvent.timestamp));

    return (
        gapDays > 0 &&
        gapDays <= previous.periodDays + previous.windowDays &&
        isWithinPriceChange(previous, next) &&
        Math.abs(differenceInCalendarDays(nextDate, expectedNextDate(previous, previousEvent.timestamp))) <= previous.windowDays
    );
};

const mergeContinuedSeries = (previous: RecurringSeriesInterface, next: RecurringSeriesInterface): RecurringSeriesInterface => ({
    ...next,
    confidence: Math.max(previous.confidence, next.confidence),
    labels: [...new Set([...previous.labels, ...next.labels])],
    events: [...previous.events, ...next.events].sort((first, second) => first.timestamp - second.timestamp)
});

const indexesMatching = (
    series: readonly RecurringSeriesInterface[],
    matches: (candidate: RecurringSeriesInterface) => boolean
): number[] => series.flatMap((candidate, index) => (matches(candidate) ? [index] : []));

const findSuccessors = (series: readonly RecurringSeriesInterface[]): (number | null)[] => {
    const successors = series.map(item => indexesMatching(series, candidate => continuesSeries(item, candidate)));
    const predecessors = series.map(item => indexesMatching(series, candidate => continuesSeries(candidate, item)));

    return series.map((_item, index) =>
        successors[index].length === 1 && predecessors[successors[index][0]].length === 1 ? successors[index][0] : null
    );
};

const chainFrom = (start: number, successorOf: readonly (number | null)[]): number[] => {
    const chain = [start];
    let cursor = successorOf[start];
    while (isDefined(cursor)) {
        chain.push(cursor);
        cursor = successorOf[cursor];
    }

    return chain;
};

export const continueRecurringSeries = (series: readonly RecurringSeriesInterface[]): RecurringSeriesInterface[] => {
    const successorOf = findSuccessors(series);
    const mergedIndexes = new Set(successorOf.filter(isDefined));
    const chains = series.flatMap((_item, index) => (mergedIndexes.has(index) ? [] : [chainFrom(index, successorOf)]));
    const consumed = new Set(chains.flat());

    return [
        ...chains.map(chain => chain.map(index => series[index]).reduce(mergeContinuedSeries)),
        ...series.filter((_item, index) => !consumed.has(index))
    ];
};

const continueEvents = (
    events: readonly RecurringSeriesEventInterface[],
    placed: readonly { readonly event: RecurringSeriesEventInterface; readonly cycle: number }[],
    cycle: number
): readonly RecurringSeriesEventInterface[] => {
    const latestAmount = events[events.length - 1].nativeAmount;
    const [candidate, ...others] = placed.filter(
        item =>
            item.cycle === cycle &&
            item.event.nativeAmount * CONTINUATION_AMOUNT_RATIO >= latestAmount &&
            item.event.nativeAmount <= latestAmount * CONTINUATION_AMOUNT_RATIO
    );

    return isDefined(candidate) && isEmptyArray(others) ? continueEvents([...events, candidate.event], placed, cycle - 1) : events;
};

export const continueRecurringStream = (
    stream: RecurringStreamInterface,
    candidates: readonly RecurringSeriesEventInterface[]
): RecurringStreamInterface => {
    const anchor = new Date(stream.anchorTimestamp);
    const latest = stream.events[stream.events.length - 1];
    const placed = candidates
        .map(event => ({ event, ...nearestCycle(anchor, new Date(event.timestamp), stream.cadence) }))
        .filter(item => item.deviation <= stream.cadence.toleranceDays);

    return {
        ...stream,
        events: continueEvents(stream.events, placed, nearestCycle(anchor, new Date(latest.timestamp), stream.cadence).cycle - 1)
    };
};
