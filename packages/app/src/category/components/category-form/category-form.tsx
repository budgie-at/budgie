import { CategoryCreateEntityInterface, CategoryEntityInterface, CategoryRepository, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AiTranslationFields } from '../../../@generic/component/ai-translation-fields/ai-translation-fields';
import { IconSuggestions } from '../../../@generic/component/icon-suggestions/icon-suggestions';
import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormMergeButton } from '../../../@generic/component/modal-form-merge-button/modal-form-merge-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';
import { useAiTranslationFields } from '../../../@generic/hook/use-ai-translation-fields.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useChatModelStatus } from '../../../ai/hook/use-chat-model-status.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useNoteInputModal } from '../../../transaction/context/note-input-modal.context';
import { useCategorySelectorModal } from '../../context/category-selector-modal.context';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { useRegenerateCategoryTranslation } from '../../hooks/use-regenerate-category-translation.hook';
import { CategoryService } from '../../service/category.service';
import { getCategoryIconTerms } from '../../utils/get-category-icon-terms.util';
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
    const language = useSetting('language');
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

    const iconTerms = getCategoryIconTerms({ title, titleEn, titleTags });

    const handleIconSelect = (selectedIcon: UserIconType) => void setValue('icon', selectedIcon);

    const handleIconPress = async () => {
        const selectedIcon = await openIconSelector({ selectedIcon: icon, keywords: iconTerms });

        if (isDefined(selectedIcon)) {
            handleIconSelect(selectedIcon);
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
            const targetCategory = await appRuntime.runPromise(
                Effect.gen(function* () {
                    const categoryRepository = yield* CategoryRepository;
                    const categoryService = yield* CategoryService;
                    const [foundCategory] = yield* categoryRepository.findById(targetCategoryId, language);
                    yield* categoryService.mergeInto(category.id, targetCategoryId);

                    return foundCategory;
                })
            );

            if (isDefined(targetCategory)) {
                onSuccess({ category: targetCategory, action: 'merged' });
            }
        } catch {
            showErrorToast(t`Could not merge category`, t`Please try again later`);
        }
    };

    const saveCategoryTranslation = async (categoryId: number): Promise<void> => {
        const hasTranslationData = isNotEmptyString(titleEn) && isNotEmptyString(titleTags);

        await appRuntime.runPromise(
            Effect.flatMap(CategoryRepository, categoryRepository =>
                hasTranslationData
                    ? categoryRepository.updateTranslation(categoryId, titleEn, titleTags)
                    : categoryRepository.clearTranslation(categoryId)
            )
        );
    };

    const handleEditSubmit = async (categoryId: number, values: CategoryCreateEntityInterface): Promise<void> => {
        await appRuntime.runPromise(
            Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.updateById(categoryId, values))
        );
        await saveCategoryTranslation(categoryId);

        const [savedCategory] = await appRuntime.runPromise(
            Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.findById(categoryId, language))
        );

        onSuccess({ category: savedCategory, action: 'updated' });
    };

    const handleCreateSubmit = async (values: CategoryCreateEntityInterface): Promise<void> => {
        const savedCategory = await appRuntime.runPromise(
            Effect.gen(function* () {
                const categoryRepository = yield* CategoryRepository;
                const createdCategory = yield* categoryRepository.create(values);

                if (isNotEmptyString(titleEn) && isNotEmptyString(titleTags)) {
                    yield* categoryRepository.updateTranslation(createdCategory.id, titleEn, titleTags);
                }

                return createdCategory;
            })
        );

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

                <IconSuggestions terms={iconTerms} limit={6} onSelect={handleIconSelect} testID={CategoryFormSelector.IconSuggestions} />

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
