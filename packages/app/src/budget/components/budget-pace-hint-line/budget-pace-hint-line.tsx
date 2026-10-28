import { convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ChevronLinkRow } from '../../../@generic/component/chevron-link-row/chevron-link-row';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly title: string;
    readonly scope: BudgetProjectionScopeInterface;
    readonly currencySymbol: string;
    readonly onPress: () => void;
}

export const BudgetPaceHintLine = ({ title, scope, currencySymbol, onPress }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const perDayAmount = formatProtectedAmount(convertFromMicroUnits(scope.safePerDay), currencySymbol);
    const label = t`${title} is running fast — keep it under ${perDayAmount}/day.`;

    return (
        <ChevronLinkRow
            label={label}
            variant="warning"
            textSizeClassName="text-sm"
            testID={BudgetSelector.DetailsPaceBanner}
            onPress={onPress}
        />
    );
};
