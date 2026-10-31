import { useFormContext, useWatch } from 'react-hook-form';

import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetCategoryLimitDeletableRow } from '../budget-category-limit-deletable-row/budget-category-limit-deletable-row';
import { BudgetLimitAmountInput } from '../budget-limit-amount-input/budget-limit-amount-input';
import { BudgetRolloverModeMenu } from '../budget-rollover-mode-menu/budget-rollover-mode-menu';

interface Props {
    readonly currencySymbol: string;
    readonly index: number;
    readonly onRemove: (index: number) => void;
}

export const BudgetCategoryLimitCompactRow = ({ currencySymbol, index, onRemove }: Props) => {
    const { control } = useFormContext<BudgetFormValues>();
    const categoryId = useWatch({ control, name: `categoryLimits.${index}.categoryId` });

    return (
        <BudgetCategoryLimitDeletableRow
            categoryId={categoryId}
            index={index}
            testID={BudgetSelector.SetupCategoryLimitRow(index)}
            amountInput={
                <BudgetLimitAmountInput
                    currencySymbol={currencySymbol}
                    name={`categoryLimits.${index}.limitAmount`}
                    testID={BudgetSelector.SetupCategoryLimitAmountInput(index)}
                />
            }
            subtitle={<BudgetRolloverModeMenu name={`categoryLimits.${index}.rolloverMode`} />}
            onRemove={onRemove}
        />
    );
};
