import { CATEGORY_TITLE_MAX_LENGTH, CategoryCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useCallback } from 'react';
import Toast from 'react-native-toast-message';

import { FormBottomSheet } from '../../../@generic/components/form-bottom-sheet/form-bottom-sheet';
import { FormBottomSheetTitleField } from '../../../@generic/components/form-bottom-sheet-title-field/form-bottom-sheet-title-field';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { CategoryFormIconField } from '../category-form-icon-field/category-form-icon-field';
import { CategoryPreview } from '../category-preview/category-preview';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly category: CategoryCreateEntityInterface | null;
}

export const CategoryFormBottomSheet = ({ ref, category }: Props) => {
    const { handleSubmit, reset, control, title, icon } = useCategoryForm(category);
    const { t } = useLingui();

    const handleCancel = () => {
        void ref.current?.close();
        reset();
    };

    const createCategory = useCallback(
        async (values: CategoryCreateEntityInterface) => {
            try {
                await categoryRepository.create(values);
                reset();
                ref.current?.close();
            } catch {
                Toast.show({
                    type: 'error',
                    text1: t`Could not create category`,
                    text2: t`Please try again later`
                });
            }
        },
        [ref, reset, t]
    );

    const onSubmit = useCallback(() => {
        void handleSubmit(createCategory)();
    }, [handleSubmit, createCategory]);

    return (
        <FormBottomSheet
            onDismiss={handleCancel}
            onCancel={handleCancel}
            onSubmit={onSubmit}
            icon="Folder"
            title={t`Create Category`}
            description={t`Add a new category to organize your transactions`}
            ref={ref}
        >
            <FormBottomSheetTitleField
                placeholder={t`e.g., Groceries, Salary, Rent`}
                maxLength={CATEGORY_TITLE_MAX_LENGTH}
                label={t`Category Name`}
                control={control}
            />
            <CategoryFormIconField control={control} />

            <CategoryPreview icon={icon} title={title} />
        </FormBottomSheet>
    );
};
