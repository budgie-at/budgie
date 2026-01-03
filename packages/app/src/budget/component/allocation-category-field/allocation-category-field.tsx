import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { CategorySelector } from '../../../category/components/category-selector/category-selector';
import { AllocationFormValues } from '../../schema/allocation-form.schema';

interface Props {
    readonly control: Control<AllocationFormValues>;
}

export const AllocationCategoryField = ({ control }: Props) => {
    const { t } = useLingui();

    const renderCategory = ({
        field: { onChange, value },
        fieldState: { error }
    }: UseControllerReturn<AllocationFormValues, 'categoryId'>) => (
        <FormItem label={t`Category`} error={error?.message}>
            <CategorySelector categoryId={value} onSelect={onChange} variant="primary" />
        </FormItem>
    );

    return <Controller name="categoryId" control={control} render={renderCategory} />;
};
