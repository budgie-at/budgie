import { CATEGORY_TITLE_MAX_LENGTH, CategoryCreateEntityInterface, CategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { FormBottomSheet } from '../../../@generic/component/form-bottom-sheet/form-bottom-sheet';
import { FormBottomSheetTitleField } from '../../../@generic/component/form-bottom-sheet-title-field/form-bottom-sheet-title-field';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { CategoryFormIconField } from '../category-form-icon-field/category-form-icon-field';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly category: CategoryEntityInterface | null;
    readonly defaultTitle?: string;
    readonly onCategoryCreated?: (category: CategoryEntityInterface) => void;
}

export const CategoryFormBottomSheet = ({ ref, category, defaultTitle, onCategoryCreated }: Props) => {
    const { t } = useLingui();

    const { handleSubmit, reset, control } = useCategoryForm(category, defaultTitle);
    const isEditing = isDefined(category?.id);

    const handleCancel = () => {
        void ref.current?.close();
        reset();
    };

    // eslint-disable-next-line react-hooks/refs
    const onSubmit = handleSubmit(async (values: CategoryCreateEntityInterface) => {
        try {
            if (isEditing) {
                await categoryRepository.updateById(category.id, values);
                reset();
                void ref.current?.close();
            } else {
                const newCategory = await categoryRepository.create(values);
                reset();
                void ref.current?.close();
                if (isDefined(onCategoryCreated)) {
                    onCategoryCreated(newCategory);
                }
            }
        } catch {
            Toast.show({
                type: 'error',
                text1: isEditing ? t`Could not update category` : t`Could not create category`,
                text2: t`Please try again later`
            });
        }
    });

    const submitLabel = isEditing ? t`Save` : t`Create`;

    /* jscpd:ignore-start */
    return (
        <FormBottomSheet onDismiss={handleCancel} onCancel={handleCancel} onSubmit={onSubmit} submitLabel={submitLabel} ref={ref}>
            <FormBottomSheetTitleField
                placeholder={t`e.g., Groceries, Salary, Rent`}
                maxLength={CATEGORY_TITLE_MAX_LENGTH}
                label={t`Category Name`}
                control={control}
            />

            <CategoryFormIconField control={control} />
        </FormBottomSheet>
    );
    /* jscpd:ignore-end */
};
