import {
    AccountEntityTable,
    BudgetKindEnum,
    BudgetLimitSourceEnum,
    BudgetPeriodEnum,
    BudgetSinkingFundEntityTable,
    ExchangeRateEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { BudgetProjectionService } from '../service/budget-projection.service';
import { fromBudgetProjectionKey } from '../utils/from-budget-projection-key.util';
import { toBudgetProjectionKey } from '../utils/to-budget-projection-key.util';

import type { BudgetProjectionKeyInterface } from '../interface/budget-projection-key.interface';
import type { BudgetProjectionSourceInterface } from '../interface/budget-projection-source.interface';
import type { BudgetSpentInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetBudgetSpentResult {
    readonly spent: BudgetSpentInterface;
    readonly isLoading: boolean;
}

const EMPTY_SPENT: BudgetSpentInterface = { spentOverall: 0, spentByCategory: [] };

const NO_BUDGET: BudgetProjectionSourceInterface = {
    id: 0,
    kind: BudgetKindEnum.MAIN,
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 1,
    useLastDayOfMonth: false,
    periodAnchorDate: null,
    startsAt: null,
    endsAt: null,
    limitSource: BudgetLimitSourceEnum.FIXED,
    instrumentId: 0,
    overallLimit: 0,
    otherLimit: 0,
    tagId: null
};

export const budgetSpentAtom = databaseQueryFamily(
    [
        TransactionEntryEntityTable,
        TransactionEntityTable,
        TransactionTagsEntityTable,
        AccountEntityTable,
        ExchangeRateEntityTable,
        BudgetSinkingFundEntityTable
    ],
    BudgetProjectionService,
    (budgetProjectionService, key: BudgetProjectionKeyInterface) =>
        budgetProjectionService.spent(fromBudgetProjectionKey(key), new Date(key.dayStart))
);

export const useGetBudgetSpentQuery = (budget: BudgetEntityInterface | null): UseGetBudgetSpentResult => {
    const today = useToday();
    const dayStart = new Date(today).setHours(0, 0, 0, 0);
    const spentKey = toBudgetProjectionKey(isDefined(budget) ? budget : NO_BUDGET, dayStart);
    const result = useLiveAtomValue(budgetSpentAtom(spentKey));

    if (!isDefined(budget) || AsyncResult.isInitial(result)) {
        return { spent: EMPTY_SPENT, isLoading: true };
    }

    if (!isPositiveNumber(budget.instrumentId)) {
        return { spent: EMPTY_SPENT, isLoading: false };
    }

    return { spent: AsyncResult.getOrElse(result, () => EMPTY_SPENT), isLoading: false };
};
