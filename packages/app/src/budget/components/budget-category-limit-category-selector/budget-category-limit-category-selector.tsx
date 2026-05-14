import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { CategoryFormSelector } from '../../../category/components/category-form-selector/category-form-selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly index: number;
    readonly excludeCategoryIds: number[];
    readonly testID?: string;
}

export const BudgetCategoryLimitCategorySelector = ({ index, excludeCategoryIds, testID }: Props) => {
    const { control } = useFormContext<BudgetFormValues>();
    const categoryId = useWatch({ control, name: `categoryLimits.${index}.categoryId` });

    const renderSelector = ({ field: { onChange } }: UseControllerReturn<BudgetFormValues, `categoryLimits.${number}.categoryId`>) => (
        <CategoryFormSelector categoryId={categoryId} onChange={onChange} excludeCategoryIds={excludeCategoryIds} testID={testID} />
    );

    return <Controller control={control} name={`categoryLimits.${index}.categoryId`} render={renderSelector} />;
};
