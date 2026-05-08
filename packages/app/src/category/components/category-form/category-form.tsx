import { CategoryCreateEntityInterface, CategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AiTranslationFields } from '../../../@generic/component/ai-translation-fields/ai-translation-fields';
import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormMergeButton } from '../../../@generic/component/modal-form-merge-button/modal-form-merge-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { useAiTranslationFields } from '../../../@generic/hook/use-ai-translation-fields.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useChatModelStatus } from '../../../ai/hook/use-chat-model-status.hook';
import { useNoteInputModal } from '../../../transaction/context/note-input-modal.context';
import { useCategorySelectorModal } from '../../context/category-selector-modal.context';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { useRegenerateCategoryTranslation } from '../../hooks/use-regenerate-category-translation.hook';
import { categoryService } from '../../service/category.service';
import { CategoryIconDisplay } from '../category-icon-display/category-icon-display';
import { CategoryTitleInput } from '../category-title-input/category-title-input';

import { CategoryFormSelector } from './category-form.selector';

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
    const [openCategorySelector] = useCategorySelectorModal();
    const [openNoteInput] = useNoteInputModal();
    const [openIconSelector] = useIconSelectorModal();
    const { regenerate, isRegenerating } = useRegenerateCategoryTranslation();
    const { isChatReady, modelStatus } = useChatModelStatus();

    const { handleSubmit, setValue, icon, title } = useCategoryForm(category ?? null, defaultTitle);

    const isEditing = isDefined(category?.id);

    const { titleEn, titleTags, setTitleEn, setTitleTags, isGenerateDisabled, handleRegenerate, handleTitleBlur } = useAiTranslationFields({
        entity: category ?? null,
        entityId: category?.id ?? 0,
        currentTitle: title,
        regenerate,
        isRegenerating,
        isModelReady: isChatReady
    });

    const isSaveDisabled = !isNotEmptyString(title);
    const headerTitle = isEditing ? t`Edit Category` : t`Create Category`;

    /* jscpd:ignore-start -- Same note-input handlers used in tag-form */
    const handleTitleEnPress = async () => {
        const result = await openNoteInput({ initialValue: titleEn ?? '' });
        if (isDefined(result)) {
            setTitleEn(result);
        }
    };

    const handleTitleTagsPress = async () => {
        const result = await openNoteInput({ initialValue: titleTags ?? '' });
        if (isDefined(result)) {
            setTitleTags(result);
        }
    };
    /* jscpd:ignore-end */

    const handleIconPress = async () => {
        const keywordSource = [titleEn, titleTags].filter(isNotEmptyString).join(' ');
        const keywords = keywordSource.split(/[,\s]+/u).filter(isNotEmptyString);

        const selectedIcon = await openIconSelector({ selectedIcon: icon, keywords });

        if (isDefined(selectedIcon)) {
            setValue('icon', selectedIcon);
        }
    };

    const handleTitleChange = (value: string) => {
        setValue('title', value);
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

    const saveCategoryTranslation = async (categoryId: number): Promise<void> => {
        const hasTranslationData = isNotEmptyString(titleEn) && isNotEmptyString(titleTags);

        if (hasTranslationData) {
            await categoryRepository.updateTranslation(categoryId, titleEn, titleTags);
        } else {
            await categoryRepository.clearTranslation(categoryId);
        }
    };

    const handleEditSubmit = async (categoryId: number, values: CategoryCreateEntityInterface): Promise<void> => {
        const updatedCategory = await categoryRepository.updateById(categoryId, values);
        await saveCategoryTranslation(categoryId);

        const translatedCategory = await categoryRepository.findById(categoryId);
        const savedCategory = translatedCategory ?? updatedCategory;

        onSuccess({ category: savedCategory, action: 'updated' });
    };

    const handleCreateSubmit = async (values: CategoryCreateEntityInterface): Promise<void> => {
        const savedCategory = await categoryRepository.create(values);
        const hasTranslationData = isNotEmptyString(titleEn) && isNotEmptyString(titleTags);

        if (hasTranslationData) {
            await categoryRepository.updateTranslation(savedCategory.id, titleEn, titleTags);
        }

        onSuccess({ category: savedCategory, action: 'created' });
    };

    const handleFormSubmit = handleSubmit(async values => {
        try {
            if (isDefined(category)) {
                await handleEditSubmit(category.id, values);
            } else {
                await handleCreateSubmit(values);
            }
        } catch {
            const errorMessage = isEditing ? t`Could not save category` : t`Could not create category`;
            showErrorToast(errorMessage, t`Please try again later`);
        }
    });

    return (
        <ModalPage header={<PageHeader title={headerTitle} onGoBack={onCancel} />}>
            <KeyboardAwareScrollView
                testID={CategoryFormSelector.ScrollView}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <CategoryIconDisplay
                    icon={icon}
                    onPress={handleIconPress}
                    triggerTestID={CategoryFormSelector.IconTrigger}
                    iconTestID={CategoryFormSelector.CurrentIcon(icon)}
                />

                <CategoryTitleInput
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    testID={CategoryFormSelector.Input}
                />

                {/* jscpd:ignore-start */}
                <AiTranslationFields
                    titleEn={titleEn}
                    titleTags={titleTags}
                    isRegenerating={isRegenerating}
                    disabled={isGenerateDisabled}
                    onRegenerate={handleRegenerate}
                    onTitleEnPress={handleTitleEnPress}
                    onTitleTagsPress={handleTitleTagsPress}
                    modelStatus={modelStatus}
                />
                {/* jscpd:ignore-end */}
            </KeyboardAwareScrollView>

            {/* jscpd:ignore-start */}
            <View className="px-3xl pb-3xl gap-y-md pt-xl">
                {isEditing ? (
                    <ModalFormMergeButton
                        testID={CategoryFormSelector.Merge}
                        onPress={handleMerge}
                        content={t`Merge into another category`}
                    />
                ) : null}

                <View className="flex-row gap-x-md">
                    <ModalFormCancelButton onPress={onCancel} />
                    <ModalFormSaveButton onPress={handleFormSubmit} disabled={isSaveDisabled} testID={CategoryFormSelector.Submit} />
                </View>
            </View>
            {/* jscpd:ignore-end */}
        </ModalPage>
    );
};
