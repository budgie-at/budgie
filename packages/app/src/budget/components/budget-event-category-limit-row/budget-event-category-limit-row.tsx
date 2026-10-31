import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

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

    const renderAmount = ({
        field: { value, onChange }
    }: UseControllerReturn<BudgetEventFormValues, `categoryLimits.${number}.limitAmount`>) => (
        <BudgetEditableAmountInput
            testID={BudgetSelector.EventCategoryLimitAmountInput(index)}
            value={value}
            currencySymbol={currencySymbol}
            className="min-w-[104px] max-w-[136px] text-right"
            onChangeValue={onChange}
        />
    );

    return (
        <BudgetCategoryLimitDeletableRow
            categoryId={categoryId}
            index={index}
            testID={BudgetSelector.EventCategoryLimitRow(index)}
            amountInput={<Controller control={control} name={`categoryLimits.${index}.limitAmount`} render={renderAmount} />}
            onRemove={onRemove}
        />
    );
};
