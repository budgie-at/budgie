import { CategoryCreateEntityInterface, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { IconSelectorBottomSheet } from '../../../@generic/component/icon-selector-bottom-sheet/icon-selector-bottom-sheet';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useCategorySelectorModal } from '../../context/category-selector-modal.context';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { useRegenerateCategoryTranslation } from '../../hooks/use-regenerate-category-translation.hook';
import { categoryService } from '../../service/category.service';
import { CategoryAiFields } from '../category-ai-fields/category-ai-fields';
import { CategoryIconDisplay } from '../category-icon-display/category-icon-display';
import { CategoryTitleInput } from '../category-title-input/category-title-input';

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

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const CategoryForm = (props: Props) => {
    const { category, defaultTitle, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const { openCategorySelector } = useCategorySelectorModal();
    const { regenerate, isRegenerating } = useRegenerateCategoryTranslation();

    const { handleSubmit, setValue, icon, title } = useCategoryForm(category ?? null, defaultTitle);

    const isEditing = isDefined(category?.id);

    const [titleEn, setTitleEn] = useState<string | null>(category?.titleEn ?? null);
    const [titleTags, setTitleTags] = useState<string | null>(category?.titleTags ?? null);

    const iconSelectorRef = useRef<BottomSheetInterface | null>(null);
    const lastRegeneratedTitle = useRef<string>(category?.title ?? '');

    const isSaveDisabled = !isNotEmptyString(title);
    const headerTitle = isEditing ? t`Edit Category` : t`Create Category`;

    const handleIconPress = () => {
        iconSelectorRef.current?.open();
    };

    const handleIconSelect = (selectedIcon: UserIconNameEnum) => {
        setValue('icon', selectedIcon);
    };

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    /* jscpd:ignore-start */
    const handleRegenerate = async () => {
        const categoryId = category?.id ?? 0;
        const result = await regenerate(categoryId, title);

        if (isDefined(result)) {
            setTitleEn(result.titleEn);
            setTitleTags(result.titleTags);
            lastRegeneratedTitle.current = title;
        }
    };

    const handleTitleBlur = () => {
        const titleChanged = title !== lastRegeneratedTitle.current;
        const hasValidTitle = isNotEmptyString(title);

        if (titleChanged && hasValidTitle && !isRegenerating) {
            void handleRegenerate();
        }
    };

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

            if (isDefined(targetCategory)) {
                onSuccess({ category: targetCategory, action: 'merged' });
            }
        } catch {
            showErrorToast(t`Could not merge category`, t`Please try again later`);
        }
    };

    const handleFormSubmit = handleSubmit(async (values: CategoryCreateEntityInterface) => {
        try {
            if (isEditing) {
                const savedCategory = await categoryRepository.updateById(category.id, { ...values, titleEn, titleTags });
                onSuccess({ category: savedCategory, action: 'updated' });
            } else {
                const savedCategory = await categoryRepository.create(values);
                const hasTranslationData = isNotEmptyString(titleEn) && isNotEmptyString(titleTags);

                if (hasTranslationData) {
                    await categoryRepository.updateTranslation(savedCategory.id, titleEn, titleTags);
                }

                onSuccess({ category: savedCategory, action: 'created' });
            }
        } catch {
            const errorMessage = isEditing ? t`Could not save category` : t`Could not create category`;
            showErrorToast(errorMessage, t`Please try again later`);
        }
    });

    const mergeButton = isEditing ? (
        <Button
            variant="ghost"
            size="sm"
            leftIcon={UserIconNameEnum.Merge}
            onPress={handleMerge}
            content={<Trans>Merge into another category</Trans>}
        />
    ) : null;

    return (
        <ModalPage header={<PageHeader title={headerTitle} onGoBack={onCancel} />}>
            <View className="flex-1">
                <CategoryIconDisplay icon={icon} onPress={handleIconPress} />

                <CategoryTitleInput value={title} onChange={handleTitleChange} onBlur={handleTitleBlur} />

                <CategoryAiFields titleEn={titleEn} titleTags={titleTags} isRegenerating={isRegenerating} onRegenerate={handleRegenerate} />
            </View>

            <View className="px-3xl pb-3xl gap-y-md pt-xl">
                {mergeButton}

                <View className="flex-row gap-x-md">
                    <Button className="flex-1" variant="ghost" onPress={onCancel} content={<Trans>Cancel</Trans>} />
                    <Button
                        className="flex-1"
                        variant="cta"
                        onPress={handleFormSubmit}
                        disabled={isSaveDisabled}
                        content={<Trans>Save</Trans>}
                    />
                </View>
            </View>

            <IconSelectorBottomSheet ref={iconSelectorRef} variant="default" selectedIcon={icon} onSelect={handleIconSelect} />
        </ModalPage>
    );
    /* jscpd:ignore-end */
};
