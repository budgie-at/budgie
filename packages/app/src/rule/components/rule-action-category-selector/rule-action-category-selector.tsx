import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionCategorySelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, formState } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value: categoryId, onChange }
    } = useController({ control, name: `actions.${index}.categoryId` });
    const [openCategorySelector] = useCategorySelectorModal();
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);

    const isMissing = !isDefined(categoryId) && formState.isDirty;

    const handleOpen = () => {
        openCategorySelector({ initialCategoryId: categoryId, variant: 'violet' }, selectedCategoryId => {
            if (isDefined(selectedCategoryId)) {
                onChange(selectedCategoryId);
            }
        });
    };

    return (
        <RuleValuePickerButton
            value={category?.title ?? null}
            isMissing={isMissing}
            placeholder={t`Choose a category`}
            name={t`Category`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
