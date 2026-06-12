import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { isEnumValue } from '../../../../@generic/type-guard/is-enum-value.type-guard';
import { BudgetMissingCurrencyGuard } from '../../../../budget/components/budget-missing-currency-guard/budget-missing-currency-guard';
import { BudgetSetupForm } from '../../../../budget/components/budget-setup-form/budget-setup-form';
import { BudgetTemplateKindEnum } from '../../../../budget/enum/budget-template-kind.enum';
import { useSetting } from '../../../../settings/hook/use-setting.hook';

const parseTemplateKind = (value: string | undefined): BudgetTemplateKindEnum | null =>
    isEnumValue(value, BudgetTemplateKindEnum) ? value : null;

export default function BudgetSetupScreen() {
    const { id, template } = useLocalSearchParams<{ id?: string; template?: string }>();
    const [editingId] = useState<number | null>(() => (isDefined(id) ? Number(id) : null));
    const [templateKind] = useState<BudgetTemplateKindEnum | null>(() => (isDefined(id) ? null : parseTemplateKind(template)));

    const defaultInstrumentId = useSetting('defaultInstrumentId');

    if (!isPositiveNumber(defaultInstrumentId)) {
        return <BudgetMissingCurrencyGuard />;
    }

    return <BudgetSetupForm defaultInstrumentId={defaultInstrumentId} editingId={editingId} templateKind={templateKind} />;
}
