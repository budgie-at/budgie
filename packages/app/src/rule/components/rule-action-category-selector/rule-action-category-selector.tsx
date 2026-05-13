import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { RuleSelectorField } from '../rule-selector-field/rule-selector-field';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionCategorySelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const [openCategorySelector] = useCategorySelectorModal();

    const categoryId = useWatch({ control, name: `actions.${index}.categoryId` });
    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const renderSelector = ({ field: { onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.categoryId`>) => {
        const handleOpen = async () => {
            const selectedCategoryId = await openCategorySelector({ initialCategoryId: categoryId ?? null, variant: 'primary' });

            if (isDefined(selectedCategoryId)) {
                onChange(selectedCategoryId);
            }
        };

        return (
            <RuleSelectorField
                label={t`Category`}
                value={selectedCategory?.title ?? t`Select Category`}
                onPress={handleOpen}
                testID={testID}
            />
        );
    };

    return <Controller control={control} name={`actions.${index}.categoryId`} render={renderSelector} />;
};
