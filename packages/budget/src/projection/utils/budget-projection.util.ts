import { addDays } from 'date-fns/addDays';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { BudgetPaceStatusEnum } from '../enum/budget-pace-status.enum';

import type { BudgetCategoryProjectionInterface } from '../interface/budget-category-projection.interface';
import type { BudgetProjectionDayInterface } from '../interface/budget-projection-day.interface';
import type { BudgetProjectionEntryInterface } from '../interface/budget-projection-entry.interface';
import type { BudgetProjectionInputInterface } from '../interface/budget-projection-input.interface';
import type { BudgetProjectionScopeInterface } from '../interface/budget-projection-scope.interface';
import type { BudgetProjectionTimelineInterface } from '../interface/budget-projection-timeline.interface';
import type { BudgetProjectionInterface } from '../interface/budget-projection.interface';
import type { BudgetUpcomingChargeInterface } from '../interface/budget-upcoming-charge.interface';

const MIN_ELAPSED_DAYS = 3;
const MIN_VARIABLE_ENTRIES = 5;
const DUPLICATE_CADENCE_RATIO = 0.5;
const STATUS_RISK_RANK: Record<BudgetPaceStatusEnum, number> = {
    [BudgetPaceStatusEnum.OVER]: 0,
    [BudgetPaceStatusEnum.AHEAD]: 1,
    [BudgetPaceStatusEnum.ON_TRACK]: 2,
    [BudgetPaceStatusEnum.TOO_EARLY]: 2
};

const sumAmounts = (items: readonly Pick<BudgetProjectionEntryInterface, 'amount'>[]): number =>
    items.reduce((total, item) => total + item.amount, 0);

const toDayIndex = (date: Date, timeline: BudgetProjectionTimelineInterface): number =>
    Math.min(Math.max(differenceInCalendarDays(date, timeline.periodStart) + 1, 1), timeline.totalDays);

const isPostedDuplicate = (charge: BudgetUpcomingChargeInterface, entries: readonly BudgetProjectionEntryInterface[]): boolean =>
    entries.some(
        entry =>
            isDefined(entry.committedSource) &&
            entry.committedSource.kind === charge.source.kind &&
            entry.committedSource.id === charge.source.id &&
            Math.abs(differenceInCalendarDays(charge.date, entry.operatedAt)) < charge.cadenceDays * DUPLICATE_CADENCE_RATIO
    );

const selectUpcomingCharges = (input: BudgetProjectionInputInterface): BudgetUpcomingChargeInterface[] => {
    const today = startOfDay(input.now);

    return input.upcomingCharges
        .filter(
            charge =>
                charge.date.getTime() >= today.getTime() &&
                charge.date.getTime() < input.nextPeriodStart.getTime() &&
                !isPostedDuplicate(charge, input.entries)
        )
        .sort((first, second) => first.date.getTime() - second.date.getTime());
};

const buildProjectedCumulative = (
    spent: number,
    dailyPace: number,
    charges: readonly BudgetUpcomingChargeInterface[],
    timeline: BudgetProjectionTimelineInterface
): number[] => {
    const chargesByDay = new Map<number, number>();

    for (const charge of charges) {
        const dayIndex = toDayIndex(charge.date, timeline);
        chargesByDay.set(dayIndex, (chargesByDay.get(dayIndex) ?? 0) + charge.amount);
    }

    const cumulative: number[] = [];
    let committedTotal = spent;

    for (let dayIndex = timeline.elapsedDays; dayIndex <= timeline.totalDays; dayIndex += 1) {
        committedTotal += chargesByDay.get(dayIndex) ?? 0;
        cumulative.push(committedTotal + dailyPace * (dayIndex - timeline.elapsedDays));
    }

    return cumulative;
};

const findRunOutAt = (cumulative: readonly number[], limit: number, timeline: BudgetProjectionTimelineInterface): Date | null => {
    const crossingOffset = cumulative.findIndex(value => value > limit);

    return crossingOffset < 0 ? null : addDays(timeline.periodStart, timeline.elapsedDays + crossingOffset - 1);
};

const resolveStatus = (spent: number, limit: number, projectedEnd: number | null): BudgetPaceStatusEnum => {
    if (spent > limit) {
        return BudgetPaceStatusEnum.OVER;
    }

    if (!isDefined(projectedEnd)) {
        return BudgetPaceStatusEnum.TOO_EARLY;
    }

    return projectedEnd > limit ? BudgetPaceStatusEnum.AHEAD : BudgetPaceStatusEnum.ON_TRACK;
};

const resolveDailyPace = (
    entries: readonly BudgetProjectionEntryInterface[],
    timeline: BudgetProjectionTimelineInterface
): number | null => {
    const variableEntries = entries.filter(entry => !isDefined(entry.committedSource));

    if (timeline.elapsedDays < MIN_ELAPSED_DAYS || variableEntries.length < MIN_VARIABLE_ENTRIES) {
        return null;
    }

    return sumAmounts(variableEntries) / timeline.elapsedDays;
};

const computeScope = (
    entries: readonly BudgetProjectionEntryInterface[],
    charges: readonly BudgetUpcomingChargeInterface[],
    limit: number,
    timeline: BudgetProjectionTimelineInterface
): BudgetProjectionScopeInterface => {
    const spent = sumAmounts(entries);
    const upcoming = sumAmounts(charges);
    const dailyPace = resolveDailyPace(entries, timeline);
    const cumulative = isDefined(dailyPace) ? buildProjectedCumulative(spent, dailyPace, charges, timeline) : [];
    const projectedEnd = isDefined(dailyPace) ? (cumulative.at(-1) ?? spent + upcoming) : null;
    const status = resolveStatus(spent, limit, projectedEnd);

    return {
        limit,
        spent,
        upcoming,
        free: limit - spent - upcoming,
        elapsedFraction: timeline.elapsedDays / timeline.totalDays,
        projectedEnd,
        projectedOver: isDefined(projectedEnd) ? projectedEnd - limit : null,
        projectedRatio: isDefined(projectedEnd) && isPositiveNumber(limit) ? projectedEnd / limit : null,
        status,
        runOutAt: status === BudgetPaceStatusEnum.AHEAD ? findRunOutAt(cumulative, limit, timeline) : null
    };
};

const buildDays = (
    entries: readonly BudgetProjectionEntryInterface[],
    charges: readonly BudgetUpcomingChargeInterface[],
    timeline: BudgetProjectionTimelineInterface
): BudgetProjectionDayInterface[] => {
    const spentByDay = new Map<number, number>();

    for (const entry of entries) {
        const dayIndex = Math.min(toDayIndex(entry.operatedAt, timeline), Math.max(timeline.elapsedDays, 1));
        spentByDay.set(dayIndex, (spentByDay.get(dayIndex) ?? 0) + entry.amount);
    }

    const dailyPace = resolveDailyPace(entries, timeline);
    const projected = isDefined(dailyPace) ? buildProjectedCumulative(sumAmounts(entries), dailyPace, charges, timeline) : [];
    let actualTotal = 0;

    return Array.from({ length: timeline.totalDays }, (_, offset) => {
        const dayIndex = offset + 1;
        actualTotal += spentByDay.get(dayIndex) ?? 0;

        return {
            date: addDays(timeline.periodStart, offset),
            actual: dayIndex <= timeline.elapsedDays ? actualTotal : null,
            projected: dayIndex >= timeline.elapsedDays ? (projected[dayIndex - timeline.elapsedDays] ?? null) : null
        };
    });
};

const compareByRisk = (first: BudgetProjectionScopeInterface, second: BudgetProjectionScopeInterface): number => {
    const rankDifference = STATUS_RISK_RANK[first.status] - STATUS_RISK_RANK[second.status];

    if (rankDifference !== 0 || !isDefined(first.projectedRatio) || !isDefined(second.projectedRatio)) {
        return rankDifference;
    }

    return second.projectedRatio - first.projectedRatio;
};

const buildTimeline = (input: BudgetProjectionInputInterface): BudgetProjectionTimelineInterface => {
    const totalDays = Math.max(differenceInCalendarDays(input.nextPeriodStart, input.periodStart), 1);

    return {
        periodStart: input.periodStart,
        totalDays,
        elapsedDays: Math.min(Math.max(differenceInCalendarDays(input.now, input.periodStart) + 1, 0), totalDays)
    };
};

export const computeBudgetProjection = (input: BudgetProjectionInputInterface): BudgetProjectionInterface => {
    const timeline = buildTimeline(input);
    const upcomingCharges = selectUpcomingCharges(input);
    const limitedCategoryIds = new Set(input.categoryLimits.map(limit => limit.categoryId));
    const isOther = (categoryId: number | null) => !isDefined(categoryId) || !limitedCategoryIds.has(categoryId);
    const categories: BudgetCategoryProjectionInterface[] = input.categoryLimits.map(limit => ({
        categoryId: limit.categoryId,
        ...computeScope(
            input.entries.filter(entry => entry.categoryId === limit.categoryId),
            upcomingCharges.filter(charge => charge.categoryId === limit.categoryId),
            limit.limitAmount,
            timeline
        )
    }));

    return {
        totalDays: timeline.totalDays,
        elapsedDays: timeline.elapsedDays,
        daysLeft: timeline.totalDays - timeline.elapsedDays,
        overall: computeScope(input.entries, upcomingCharges, input.overallLimit, timeline),
        categories: categories.sort(compareByRisk),
        other: computeScope(
            input.entries.filter(entry => isOther(entry.categoryId)),
            upcomingCharges.filter(charge => isOther(charge.categoryId)),
            input.otherLimit,
            timeline
        ),
        days: buildDays(input.entries, upcomingCharges, timeline),
        upcomingCharges
    };
};
