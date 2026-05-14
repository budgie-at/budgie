import { RemovableFormRow } from '../../../@generic/component/removable-form-row/removable-form-row';
import { BudgetSelector } from '../../budget.selector';
import { BudgetCategoryLimitAmountInput } from '../budget-category-limit-amount-input/budget-category-limit-amount-input';
import { BudgetCategoryLimitCategorySelector } from '../budget-category-limit-category-selector/budget-category-limit-category-selector';

interface Props {
    readonly index: number;
    readonly excludeCategoryIds: number[];
    readonly onRemove: (index: number) => void;
}

export const BudgetCategoryLimitFormRow = ({ index, excludeCategoryIds, onRemove }: Props) => {
    const handleRemove = () => void onRemove(index);

    return (
        <RemovableFormRow
            testID={BudgetSelector.SetupCategoryLimitRow(index)}
            removeTestID={BudgetSelector.SetupCategoryLimitRemoveButton(index)}
            density="compact"
            onRemove={handleRemove}
        >
            <BudgetCategoryLimitCategorySelector
                index={index}
                excludeCategoryIds={excludeCategoryIds}
                testID={BudgetSelector.SetupCategoryLimitCategorySelector(index)}
            />

            <BudgetCategoryLimitAmountInput index={index} testID={BudgetSelector.SetupCategoryLimitAmountInput(index)} />
        </RemovableFormRow>
    );
};
