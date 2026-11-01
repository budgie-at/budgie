import { computeFundSetAside } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { BUDGET_PERIOD_RATE_LABEL } from '../../constant/budget-period-rate-label.constant';
import { BUDGET_PERIOD_THIS_LABEL } from '../../constant/budget-period-this-label.constant';
import { isFundBehind } from '../../utils/is-fund-behind.util';
import { resolveBudgetWindow } from '../../utils/resolve-budget-window.util';

import type { BudgetEntityInterface, BudgetSinkingFundEntityInterface } from '@budgie/contracts';

interface Props {
    readonly fund: BudgetSinkingFundEntityInterface;
    readonly budget: BudgetEntityInterface;
    readonly dueLabel: string;
    readonly currencySymbol: string;
}

export const BudgetFundRowStatus = ({ fund, budget, dueLabel, currencySymbol }: Props) => {
    const { t } = useLingui();
    const today = useToday();
    const formatDigits = useFormatDigits(0);
    const setAside = computeFundSetAside(fund, resolveBudgetWindow(budget, today), budget);
    const setAsideLabel = formatDigits(convertFromMicroUnits(setAside), currencySymbol);
    const thisPeriod = t(BUDGET_PERIOD_THIS_LABEL[budget.period]);
    const rate = t(BUDGET_PERIOD_RATE_LABEL[budget.period]);
    const settledLabel = setAside > 0 ? t`${setAsideLabel} to set aside ${thisPeriod}` : t`Fully funded`;

    if (isFundBehind(fund, today)) {
        return (
            <Text className="text-xs text-secondary-foreground">
                {dueLabel} · <Text className="text-warning-strong">{t`Behind, ${setAsideLabel} ${rate} to catch up`}</Text>
            </Text>
        );
    }

    return (
        <Text className="text-xs text-secondary-foreground">
            {dueLabel} · {settledLabel}
        </Text>
    );
};
