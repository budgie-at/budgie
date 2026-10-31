import { computeFundSetAside } from '@budgie/budget';
import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';
import { BUDGET_PERIOD_RATE_LABEL } from '../../constant/budget-period-rate-label.constant';
import { resolveBudgetWindow } from '../../utils/resolve-budget-window.util';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
    readonly fundedAmount: number;
    readonly currencySymbol: string;
}

export const BudgetFundPreview = ({ budget, fundedAmount, currencySymbol }: Props) => {
    const { t } = useLingui();
    const today = useToday();
    const formatDigits = useFormatDigits(0);
    const { control } = useFormContext<BudgetFundFormValues>();
    const [targetAmount, dueAtMs] = useWatch({ control, name: ['targetAmount', 'dueAtMs'] });
    const setAside = computeFundSetAside(
        { targetAmount: convertToMicroUnits(targetAmount), fundedAmount, dueAt: new Date(dueAtMs) },
        resolveBudgetWindow(budget, today),
        budget
    );
    if (setAside <= 0) {
        return null;
    }

    const amountLabel = formatDigits(convertFromMicroUnits(setAside), currencySymbol);
    const rate = t(BUDGET_PERIOD_RATE_LABEL[budget.period]);

    return <Text className="text-md font-medium text-primary">{t`Budgie sets aside ${amountLabel} ${rate}`}</Text>;
};
