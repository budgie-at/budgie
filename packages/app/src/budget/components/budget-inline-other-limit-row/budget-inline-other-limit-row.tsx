import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { useFormContext } from 'react-hook-form';

import { BudgetSelector } from '../../budget.selector';
import { BudgetCategoryLimitCompactRowLayout } from '../budget-category-limit-compact-row-layout/budget-category-limit-compact-row-layout';
import { BudgetEditableAmountInput } from '../budget-editable-amount-input/budget-editable-amount-input';
import { BudgetRolloverModeMenu } from '../budget-rollover-mode-menu/budget-rollover-mode-menu';

import type { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetInlineOtherLimitRow = ({ currencySymbol }: Props) => {
    const { control } = useFormContext<BudgetFormValues>();

    return (
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
                <BudgetEditableAmountInput
                    control={control}
                    className="min-w-[104px] max-w-[136px] text-right"
                    currencySymbol={currencySymbol}
                    name="otherLimit"
                    testID={BudgetSelector.SetupOtherLimitAmountInput}
                />
            }
        />
    );
};
