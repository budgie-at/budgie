import { useFormContext, useWatch } from 'react-hook-form';

import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { useBudgetCategoryLimitAmountLabel } from '../../hooks/use-budget-category-limit-amount-label.hook';
import { BudgetCategoryLimitDeletableRow } from '../budget-category-limit-deletable-row/budget-category-limit-deletable-row';
import { BudgetEditableAmountInput } from '../budget-editable-amount-input/budget-editable-amount-input';

interface Props {
    readonly currencySymbol: string;
    readonly index: number;
    readonly onRemove: (index: number) => void;
}

export const BudgetCategoryLimitCompactRow = ({ currencySymbol, index, onRemove }: Props) => {
    const { control } = useFormContext<BudgetFormValues>();
    const categoryId = useWatch({ control, name: `categoryLimits.${index}.categoryId` });
    const amountLabel = useBudgetCategoryLimitAmountLabel(categoryId);

    return (
        <BudgetCategoryLimitDeletableRow
            categoryId={categoryId}
            index={index}
            testID={BudgetSelector.SetupCategoryLimitRow(index)}
            amountInput={
                <BudgetEditableAmountInput
                    control={control}
                    className="min-w-[76px] max-w-[120px] text-right"
                    currencySymbol={currencySymbol}
                    accessibilityLabel={amountLabel}
                    name={`categoryLimits.${index}.limitAmount`}
                    testID={BudgetSelector.SetupCategoryLimitAmountInput(index)}
                />
            }
            rolloverName={`categoryLimits.${index}.rolloverMode`}
            onRemove={onRemove}
        />
    );
};
