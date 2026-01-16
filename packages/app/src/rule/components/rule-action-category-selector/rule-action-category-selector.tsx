import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { RuleActionBottomSheetSelector } from '../rule-action-bottom-sheet-selector/rule-action-bottom-sheet-selector';
import { RuleIconSlot } from '../rule-icon-slot/rule-icon-slot';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionCategorySelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const categoryId = useWatch({ control, name: `actions.${index}.categoryId` });
    const { categories } = useSearchCategoriesQuery('', true);

    const selectedCategory = categories.find(category => category.id === categoryId);
    const options = categories.map(category => ({
        value: category.id,
        label: category.title,
        iconSlot: <RuleIconSlot icon={category.icon} />
    }));

    const renderSelector = ({
        field: { value, onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.categoryId`>) => (
        <RuleActionBottomSheetSelector
            value={value}
            onChange={onChange}
            options={options}
            label={t`Category`}
            sheetTitle={t`Select Category`}
            displayValue={selectedCategory?.title ?? t`Select Category`}
            testID={testID}
        />
    );

    return <Controller control={control} name={`actions.${index}.categoryId`} render={renderSelector} />;
};
