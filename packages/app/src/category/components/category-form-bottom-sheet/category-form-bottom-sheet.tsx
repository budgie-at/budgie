/* jscpd:ignore-start */
import { CATEGORY_TITLE_MAX_LENGTH, CategoryCreateEntityInterface, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject, useRef } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { CategoryFormSelectors } from '../../../@e2e/selectors/category-form.selector';
import { Button } from '../../../@generic/component/button/button';
import { FormBottomSheet } from '../../../@generic/component/form-bottom-sheet/form-bottom-sheet';
import { FormBottomSheetTitleField } from '../../../@generic/component/form-bottom-sheet-title-field/form-bottom-sheet-title-field';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { categoryService } from '../../service/category.service';
import { CategoryFormIconField } from '../category-form-icon-field/category-form-icon-field';
import { CategorySelectorBottomSheet } from '../category-selector-bottom-sheet/category-selector-bottom-sheet';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly category: CategoryEntityInterface | null;
    readonly defaultTitle?: string;
    readonly onCategoryCreated?: (category: CategoryEntityInterface) => void;
    readonly onCategoryMerged?: () => void;
}

// eslint-disable-next-line max-lines-per-function -- Form component requires many lines
export const CategoryFormBottomSheet = ({ ref, category, defaultTitle, onCategoryCreated, onCategoryMerged }: Props) => {
    const { t } = useLingui();

    const mergeSelectorRef = useRef<BottomSheetInterface | null>(null);

    const { handleSubmit, reset, control } = useCategoryForm(category, defaultTitle);
    const isEditing = isDefined(category?.id);
    const excludeCategoryIds = isDefined(category?.id) ? [category.id] : [];

    const handleCancel = () => {
        void ref.current?.close();
        reset();
    };

    // eslint-disable-next-line react-hooks/refs
    const onSubmit = handleSubmit(async (values: CategoryCreateEntityInterface) => {
        try {
            const savedCategory = isEditing
                ? await categoryRepository.updateById(category.id, values)
                : await categoryRepository.create(values);
            reset();
            void ref.current?.close();
            if (!isEditing) {
                onCategoryCreated?.(savedCategory);
            }
        } catch {
            Toast.show({
                type: 'error',
                text1: isEditing ? t`Could not update category` : t`Could not create category`,
                text2: t`Please try again later`
            });
        }
    });

    const handleOpenMerge = () => {
        void mergeSelectorRef.current?.open();
    };

    const handleMergeSelect = async (targetCategoryId: number | null) => {
        if (!isDefined(category?.id) || !isDefined(targetCategoryId)) {
            return;
        }

        try {
            await categoryService.mergeInto(category.id, targetCategoryId);
            void mergeSelectorRef.current?.close();
            void ref.current?.close();
            reset();
            onCategoryMerged?.();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not merge category`,
                text2: t`Please try again later`
            });
        }
    };

    const submitLabel = isEditing ? t`Save` : t`Create`;

    return (
        <>
            <FormBottomSheet
                submitButtonTestID={CategoryFormSelectors.Submit}
                onDismiss={handleCancel}
                onCancel={handleCancel}
                onSubmit={onSubmit}
                submitLabel={submitLabel}
                ref={ref}
            >
                <FormBottomSheetTitleField
                    placeholder={t`e.g., Groceries, Salary, Rent`}
                    maxLength={CATEGORY_TITLE_MAX_LENGTH}
                    testID={CategoryFormSelectors.Input}
                    label={t`Category Name`}
                    control={control}
                />

                <CategoryFormIconField control={control} />

                {isEditing ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={UserIconNameEnum.Merge}
                        onPress={handleOpenMerge}
                        content={<Trans>Merge into another category</Trans>}
                    />
                ) : null}
            </FormBottomSheet>

            {isEditing && isDefined(category) ? (
                <CategorySelectorBottomSheet
                    ref={mergeSelectorRef}
                    selectedCategory={null}
                    excludeCategoryIds={excludeCategoryIds}
                    variant="primary"
                    onSelect={handleMergeSelect}
                />
            ) : null}
        </>
    );
};
/* jscpd:ignore-end */
