import {
    AccountEntityTable,
    BudgetSinkingFundEntityTable,
    ExchangeRateEntityTable,
    SettingsEntityTable,
    SyncOutboxEntityTable,
    SyncRecordEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTagsEntityTable
} from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useToday } from '../../@generic/hook/use-today.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { BudgetProjectionService } from '../service/budget-projection.service';
import { fromBudgetProjectionKey } from '../utils/from-budget-projection-key.util';
import { toBudgetProjectionKey } from '../utils/to-budget-projection-key.util';

import type { BudgetProjectionKeyInterface } from '../interface/budget-projection-key.interface';
import type { BudgetSpentInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';

interface UseGetBudgetSpentResult {
    readonly spent: BudgetSpentInterface;
    readonly isLoading: boolean;
}

const EMPTY_SPENT: BudgetSpentInterface = { spentOverall: 0, spentByCategory: [] };

const emptyBudgetSpentAtom = Atom.make(AsyncResult.success(EMPTY_SPENT));

export const budgetSpentAtom = databaseQueryFamily(
    [
        SyncRecordEntityTable,
        SyncOutboxEntityTable,
        SettingsEntityTable,
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
    const shouldQuery = isDefined(budget) && isPositiveNumber(budget.id) && isPositiveNumber(budget.instrumentId);
    const result = useLiveAtomValue(shouldQuery ? budgetSpentAtom(toBudgetProjectionKey(budget, dayStart)) : emptyBudgetSpentAtom);

    if (!isDefined(budget) || AsyncResult.isInitial(result)) {
        return { spent: EMPTY_SPENT, isLoading: true };
    }

    if (!shouldQuery) {
        return { spent: EMPTY_SPENT, isLoading: false };
    }

    return { spent: AsyncResult.getOrElse(result, () => EMPTY_SPENT), isLoading: false };
};
