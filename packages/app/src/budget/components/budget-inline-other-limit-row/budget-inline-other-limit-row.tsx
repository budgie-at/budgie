import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { BudgetSelector } from '../../budget.selector';
import { BudgetCategoryLimitCompactRowLayout } from '../budget-category-limit-compact-row-layout/budget-category-limit-compact-row-layout';
import { BudgetLimitAmountInput } from '../budget-limit-amount-input/budget-limit-amount-input';
import { BudgetRolloverModeMenu } from '../budget-rollover-mode-menu/budget-rollover-mode-menu';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetInlineOtherLimitRow = ({ currencySymbol }: Props) => (
    <BudgetCategoryLimitCompactRowLayout
        leading={
            <BudgetRolloverModeMenu
                name="otherRolloverMode"
                icon={UserIconNameEnum.CircleEllipsis}
                title={t`Other`}
                testID={BudgetSelector.SetupOtherLimitRow}
            />
        }
        amountInput={
            <BudgetLimitAmountInput currencySymbol={currencySymbol} name="otherLimit" testID={BudgetSelector.SetupOtherLimitAmountInput} />
        }
    />
);
