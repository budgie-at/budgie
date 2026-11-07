import { useFormContext, useWatch } from 'react-hook-form';

import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { BudgetCategoryLimitDeletableRow } from '../budget-category-limit-deletable-row/budget-category-limit-deletable-row';
import { BudgetEditableAmountInput } from '../budget-editable-amount-input/budget-editable-amount-input';

interface Props {
    readonly currencySymbol: string;
    readonly index: number;
    readonly onRemove: (index: number) => void;
}

export const BudgetEventCategoryLimitRow = ({ currencySymbol, index, onRemove }: Props) => {
    const { control } = useFormContext<BudgetEventFormValues>();
    const categoryId = useWatch({ control, name: `categoryLimits.${index}.categoryId` });

    return (
        <BudgetCategoryLimitDeletableRow
            categoryId={categoryId}
            index={index}
            testID={BudgetSelector.EventCategoryLimitRow(index)}
            amountInput={
                <BudgetEditableAmountInput
                    control={control}
                    name={`categoryLimits.${index}.limitAmount`}
                    testID={BudgetSelector.EventCategoryLimitAmountInput(index)}
                    currencySymbol={currencySymbol}
                />
            }
            onRemove={onRemove}
        />
    );
};
