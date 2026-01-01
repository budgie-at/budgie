import { useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../../@generic/component/empty-screen/empty-screen';
import { IdParamInterface } from '../../../../@generic/interface/id-param.interface';
import { CreateAllocation } from '../../../../budget/component/create-allocation/create-allocation';
import { useGetBudgetByIdQuery } from '../../../../budget/query/use-get-budget-by-id.query';
import { useGetInstrumentByIdQuery } from '../../../../instrument/query/use-get-instrument-by-id.query';

export default function AddAllocationPage() {
    const params = useLocalSearchParams<IdParamInterface>();
    const budgetId = Number(params.id);

    const { budget, isLoading } = useGetBudgetByIdQuery(budgetId);
    const { instrument } = useGetInstrumentByIdQuery(budget?.instrumentId ?? 0);

    if (isLoading || !isDefined(budget)) {
        return <EmptyScreen />;
    }

    return <CreateAllocation budgetId={budgetId} currencySymbol={instrument?.symbol ?? ''} />;
}

