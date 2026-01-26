import { CATEGORY_TITLE_MAX_LENGTH, CategoryCreateEntityInterface, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, TextInput, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useCategorySelectorModal } from '../../context/category-selector-modal.context';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { categoryService } from '../../service/category.service';
import { CategoryFormIconField } from '../category-form-icon-field/category-form-icon-field';

type CategoryFormAction = 'created' | 'updated' | 'merged' | 'cancelled';

export interface CategoryFormResult {
    readonly category: CategoryEntityInterface;
    readonly action: CategoryFormAction;
}

interface Props {
    readonly category?: CategoryEntityInterface;
    readonly defaultTitle?: string;
    readonly onSuccess: (result: CategoryFormResult) => void;
    readonly onCancel: () => void;
}

export const CategoryForm = (props: Props) => {
    const { category, defaultTitle, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const { backgroundColor } = useFormsheetListStyles();
    const { openCategorySelector } = useCategorySelectorModal();
    const { handleSubmit, reset, register, control } = useCategoryForm(category ?? null, defaultTitle);

    const isEditing = isDefined(category?.id);
    const containerStyle = { flex: 1, backgroundColor };
    const spacerStyle = { height: 1000, backgroundColor };
    const title = isEditing ? <Trans>Edit Category</Trans> : <Trans>Create Category</Trans>;
    const submitButtonContent = isEditing ? <Trans>Save</Trans> : <Trans>Create</Trans>;

    const handleFormSubmit = handleSubmit(async (values: CategoryCreateEntityInterface) => {
        try {
            const savedCategory = isEditing
                ? await categoryRepository.updateById(category.id, values)
                : await categoryRepository.create(values);
            reset();
            onSuccess({ category: savedCategory, action: isEditing ? 'updated' : 'created' });
        } catch {
            showErrorToast(isEditing ? t`Could not update category` : t`Could not create category`, t`Please try again later`);
        }
    });

    const handleMerge = async () => {
        if (!isDefined(category?.id)) {
            return;
        }
        const targetCategoryId = await openCategorySelector({
            excludeCategoryIds: [category.id],
            description: t`Select a category to merge into`,
            variant: 'primary'
        });

        if (!isDefined(targetCategoryId)) {
            return;
        }
        try {
            const targetCategory = await categoryRepository.findById(targetCategoryId);
            await categoryService.mergeInto(category.id, targetCategoryId);
            reset();
            if (isDefined(targetCategory)) {
                onSuccess({ category: targetCategory, action: 'merged' });
            }
            /* jscpd:ignore-start - Form merge pattern */
        } catch {
            showErrorToast(t`Could not merge category`, t`Please try again later`);
        }
    };

    const handleCancelPress = () => {
        reset();
        onCancel();
    };

    return (
        <View style={containerStyle}>
            <View className="pt-4xl pb-3xl px-xl">
                <Text className="text-primary text-xl font-semibold text-center">{title}</Text>
            </View>
            <View className="px-xl gap-y-xl">
                <FormItem label={t`Category Name`}>
                    <TextInput
                        className="h-[48px] px-lg bg-secondary-background rounded-xl border border-secondary-corner text-primary"
                        placeholder={t`e.g., Groceries, Salary, Rent`}
                        maxLength={CATEGORY_TITLE_MAX_LENGTH}
                        autoCapitalize="words"
                        autoCorrect={false}
                        {...register('title')}
                    />
                </FormItem>
                <CategoryFormIconField control={control} />
                {isEditing ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={UserIconNameEnum.Merge}
                        onPress={handleMerge}
                        content={<Trans>Merge into another category</Trans>}
                    />
                ) : null}
                <View className="flex-row gap-x-md pt-md">
                    <Button className="flex-1" variant="ghost" onPress={handleCancelPress} content={<Trans>Cancel</Trans>} />
                    <Button className="flex-1" variant="cta" onPress={handleFormSubmit} content={submitButtonContent} />
                </View>
            </View>
            <View style={spacerStyle} />
        </View>
    );
    /* jscpd:ignore-end */
};
