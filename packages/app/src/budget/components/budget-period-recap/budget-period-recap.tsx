import { isDefined } from '@rnw-community/shared';

import { useGetBudgetPeriodSnapshotsQuery } from '../../query/use-get-budget-period-snapshots.query';
import { BudgetPeriodRecapCard } from '../budget-period-recap-card/budget-period-recap-card';

import type { BudgetPeriodEnum } from '@budgie/contracts';

interface Props {
    readonly budgetId: number;
    readonly period: BudgetPeriodEnum;
    readonly currencySymbol: string;
}

export const BudgetPeriodRecap = ({ budgetId, period, currencySymbol }: Props) => {
    const { snapshots } = useGetBudgetPeriodSnapshotsQuery(budgetId);
    const recap = snapshots.find(snapshot => !snapshot.isReconstructed && !isDefined(snapshot.recapSeenAt));

    if (!isDefined(recap)) {
        return null;
    }

    return <BudgetPeriodRecapCard snapshot={recap} period={period} currencySymbol={currencySymbol} />;
};
