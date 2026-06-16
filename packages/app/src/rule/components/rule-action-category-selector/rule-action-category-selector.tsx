import { RuleCreateInputInterface } from '@budgie/contracts';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { CategoryFormSelector } from '../../../category/components/category-form-selector/category-form-selector';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionCategorySelector = ({ index, testID }: Props) => {
    const { control } = useFormContext<RuleCreateInputInterface>();
    const categoryId = useWatch({ control, name: `actions.${index}.categoryId` });

    const renderSelector = ({ field: { onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.categoryId`>) => (
        <CategoryFormSelector categoryId={categoryId ?? null} onChange={onChange} testID={testID} />
    );

    return <Controller control={control} name={`actions.${index}.categoryId`} render={renderSelector} />;
};
