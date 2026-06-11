import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { BudgetSelector } from '../../budget.selector';
import { BudgetCategoryLimitCompactRowLayout } from '../budget-category-limit-compact-row-layout/budget-category-limit-compact-row-layout';
import { BudgetLimitAmountInput } from '../budget-limit-amount-input/budget-limit-amount-input';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetOtherLimitCompactRow = ({ currencySymbol }: Props) => {
    const { t } = useLingui();

    return (
        <BudgetCategoryLimitCompactRowLayout
            amountInput={
                <BudgetLimitAmountInput
                    currencySymbol={currencySymbol}
                    name="otherLimit"
                    testID={BudgetSelector.SetupOtherLimitAmountInput}
                />
            }
            icon={<CircleIcon icon={UserIconNameEnum.CircleEllipsis} variant="ghost" size={32} iconSize={16} />}
            testID={BudgetSelector.SetupOtherLimitRow}
            title={t`Other`}
        />
    );
};
