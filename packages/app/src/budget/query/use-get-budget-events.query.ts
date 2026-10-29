import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { BUDGET_PROJECTION_TABLES } from '../constant/budget-projection-tables.constant';
import { BudgetProjectionService } from '../service/budget-projection.service';

import type { BudgetEventProjectionInterface } from '../interface/budget-event-projection.interface';

interface UseGetBudgetEventsResult {
    readonly events: readonly BudgetEventProjectionInterface[];
    readonly isLoading: boolean;
}

const EMPTY_EVENTS: readonly BudgetEventProjectionInterface[] = [];

export const budgetEventsAtom = databaseQueryFamily(
    BUDGET_PROJECTION_TABLES,
    BudgetProjectionService,
    (budgetProjectionService, dayStart: number) => budgetProjectionService.projectEvents(new Date(dayStart))
);

export const useGetBudgetEventsQuery = (): UseGetBudgetEventsResult => {
    const today = useToday();
    const result = useLiveAtomValue(budgetEventsAtom(new Date(today).setHours(0, 0, 0, 0)));

    if (AsyncResult.isInitial(result)) {
        return { events: EMPTY_EVENTS, isLoading: true };
    }

    return { events: AsyncResult.getOrElse(result, () => EMPTY_EVENTS), isLoading: false };
};
