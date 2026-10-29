import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { RuleSelectorButton } from '../../../rule/components/rule-selector-button/rule-selector-button';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';

export const BudgetFundCategoryField = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<BudgetFundFormValues>();
    const [openCategorySelector] = useCategorySelectorModal();
    const categoryId = useWatch({ control, name: 'categoryId' });
    const { category } = useGetCategoryByIdQuery(categoryId);
    const categoryTitle = isDefined(category) ? category.title : t`Select category`;

    const handleOpen = () => {
        openCategorySelector({ initialCategoryId: isPositiveNumber(categoryId) ? categoryId : null }, selectedCategoryId => {
            if (isPositiveNumber(selectedCategoryId)) {
                setValue('categoryId', selectedCategoryId, { shouldDirty: true, shouldValidate: true });
            }
        });
    };

    return (
        <FormItem label={t`Category`}>
            <RuleSelectorButton testID={BudgetSelector.FundCategoryField} value={categoryTitle} onPress={handleOpen} />
        </FormItem>
    );
};
