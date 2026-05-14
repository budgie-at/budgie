import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FormSelectorField } from '../../../@generic/component/form-selector-field/form-selector-field';
import { useCategorySelectorModal } from '../../context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../query/use-get-category-by-id.query';

interface Props {
    readonly categoryId: number | null;
    readonly onChange: (categoryId: number) => void;
    readonly excludeCategoryIds?: number[];
    readonly testID?: string;
}

export const CategoryFormSelector = ({ categoryId, onChange, excludeCategoryIds, testID }: Props) => {
    const { t } = useLingui();
    const [openCategorySelector] = useCategorySelectorModal();
    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handleOpen = async () => {
        const selectedCategoryId = await openCategorySelector({
            initialCategoryId: categoryId,
            excludeCategoryIds,
            variant: 'primary'
        });

        if (isDefined(selectedCategoryId)) {
            onChange(selectedCategoryId);
        }
    };

    return (
        <FormSelectorField label={t`Category`} value={selectedCategory?.title ?? t`Select Category`} onPress={handleOpen} testID={testID} />
    );
};
