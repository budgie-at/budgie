import { RecurringSeriesKindEnum, RecurringSeriesStatusEnum } from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import type { BudgetFundSuggestionSeriesInterface } from '../interface/budget-fund-suggestion-series.interface';
import type { BudgetFundSuggestionInterface } from '../interface/budget-fund-suggestion.interface';

const MIN_PERIOD_DAYS = 150;
const MAX_PERIOD_DAYS = 400;
const DAYS_PER_MONTH = 30.4375;

const computeNextDueAt = (lastSeenAt: Date, periodDays: number, now: Date): Date => {
    const today = startOfDay(now);
    const cycles = Math.max(0, Math.ceil(differenceInCalendarDays(today, startOfDay(lastSeenAt)) / periodDays));
    const dueAt = addDays(startOfDay(lastSeenAt), periodDays * cycles);

    return dueAt.getTime() <= today.getTime() ? addDays(dueAt, periodDays) : dueAt;
};

export const buildFundSuggestions = (
    series: readonly BudgetFundSuggestionSeriesInterface[],
    linkedSeriesIds: readonly number[],
    rate: number,
    now: Date
): BudgetFundSuggestionInterface[] =>
    series
        .filter(
            row =>
                row.kind === RecurringSeriesKindEnum.EXPENSE &&
                row.status === RecurringSeriesStatusEnum.ACTIVE &&
                (!isDefined(row.endsAt) || row.endsAt.getTime() >= now.getTime()) &&
                isDefined(row.categoryId) &&
                row.periodDays >= MIN_PERIOD_DAYS &&
                row.periodDays <= MAX_PERIOD_DAYS &&
                !linkedSeriesIds.includes(row.id)
        )
        .flatMap(row =>
            isDefined(row.categoryId)
                ? [
                      {
                          recurringSeriesId: row.id,
                          name: row.title,
                          categoryId: row.categoryId,
                          targetAmount: Math.round(row.defaultAmount * rate),
                          dueAt: computeNextDueAt(row.lastSeenAt, row.periodDays, now),
                          repeatEveryMonths: Math.round(row.periodDays / DAYS_PER_MONTH)
                      }
                  ]
                : []
        )
        .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime());
