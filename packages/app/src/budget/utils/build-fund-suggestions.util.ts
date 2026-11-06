import { RecurringSeriesKindEnum, RecurringSeriesStatusEnum } from '@budgie/contracts';
import { nextOccurrences } from '@budgie/recurring';
import { addDays } from 'date-fns/addDays';
import { startOfDay } from 'date-fns/startOfDay';

import { isDefined } from '@rnw-community/shared';

import type { BudgetFundSuggestionSeriesInterface } from '../interface/budget-fund-suggestion-series.interface';
import type { BudgetFundSuggestionInterface } from '../interface/budget-fund-suggestion.interface';

const MIN_PERIOD_DAYS = 150;
const MAX_PERIOD_DAYS = 400;
const DAYS_PER_MONTH = 30.4375;

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
                isDefined(row.categoryId) &&
                row.periodDays >= MIN_PERIOD_DAYS &&
                row.periodDays <= MAX_PERIOD_DAYS &&
                !linkedSeriesIds.includes(row.id)
        )
        .flatMap(row => {
            const dueAt = nextOccurrences(row, addDays(startOfDay(now), 1), 1).at(0);

            return isDefined(row.categoryId) && isDefined(dueAt)
                ? [
                      {
                          recurringSeriesId: row.id,
                          name: row.title,
                          categoryId: row.categoryId,
                          targetAmount: Math.round(row.defaultAmount * rate),
                          dueAt,
                          repeatEveryMonths: Math.round(row.periodDays / DAYS_PER_MONTH)
                      }
                  ]
                : [];
        })
        .sort((left, right) => left.dueAt.getTime() - right.dueAt.getTime());
