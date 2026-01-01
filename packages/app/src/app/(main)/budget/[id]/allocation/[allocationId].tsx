import { Redirect, useLocalSearchParams } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../../../@generic/component/empty-screen/empty-screen';
import { EditAllocation } from '../../../../../budget/component/edit-allocation/edit-allocation';
import { useGetAllocationByIdQuery } from '../../../../../budget/query/use-get-allocation-by-id.query';
import { useGetBudgetByIdQuery } from '../../../../../budget/query/use-get-budget-by-id.query';
import { useGetInstrumentByIdQuery } from '../../../../../instrument/query/use-get-instrument-by-id.query';

export default function EditAllocationPage() {
    const params = useLocalSearchParams<{ id: string; allocationId: string }>();
    const budgetId = Number(params.id);
    const allocationId = Number(params.allocationId);

    const { budget } = useGetBudgetByIdQuery(budgetId);
    const { allocation, isLoading } = useGetAllocationByIdQuery(allocationId);
    const { instrument } = useGetInstrumentByIdQuery(budget?.instrumentId ?? 0);

    if (isLoading) {
        return <EmptyScreen />;
    }

    if (!isDefined(allocation)) {
        return <Redirect href={`/budget/${budgetId}`} />;
    }

    return <EditAllocation allocation={allocation} currencySymbol={instrument?.symbol ?? ''} />;
}

