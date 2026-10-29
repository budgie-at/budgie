import { useLocalSearchParams } from 'expo-router';

import { isPositiveNumber } from '@rnw-community/shared';

import { BudgetEventForm } from '../../../../../budget/components/budget-event-form/budget-event-form';
import { BudgetMissingCurrencyGuard } from '../../../../../budget/components/budget-missing-currency-guard/budget-missing-currency-guard';
import { useSetting } from '../../../../../settings/hook/use-setting.hook';

export default function BudgetEventEditScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const defaultInstrumentId = useSetting('defaultInstrumentId');

    if (!isPositiveNumber(defaultInstrumentId)) {
        return <BudgetMissingCurrencyGuard />;
    }

    return <BudgetEventForm defaultInstrumentId={defaultInstrumentId} editingId={Number(id)} />;
}
