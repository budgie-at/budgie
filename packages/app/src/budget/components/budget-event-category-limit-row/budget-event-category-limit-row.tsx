import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { BudgetCategoryLimitDeletableRow } from '../budget-category-limit-deletable-row/budget-category-limit-deletable-row';

interface Props {
    readonly currencySymbol: string;
    readonly index: number;
    readonly onRemove: (index: number) => void;
}

export const BudgetEventCategoryLimitRow = ({ currencySymbol, index, onRemove }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetEventFormValues>();
    const categoryId = useWatch({ control, name: `categoryLimits.${index}.categoryId` });

    const renderAmount = ({
        field: { value, onChange }
    }: UseControllerReturn<BudgetEventFormValues, `categoryLimits.${number}.limitAmount`>) => (
        <AmountInput
            testID={BudgetSelector.EventCategoryLimitAmountInput(index)}
            value={value}
            onChangeValue={onChange}
            placeholder={t`e.g. 200`}
            valuePrefix={currencySymbol}
            size="md"
            borderless
            textAlign="right"
            inputClassName="min-w-[104px] max-w-[136px]"
            commitOnBlur
            selectTextOnFocus
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
