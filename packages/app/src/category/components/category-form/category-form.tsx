import { CategoryCreateEntityInterface, CategoryEntityInterface, CategoryRepository, UserIconType } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AiTranslationFields } from '../../../@generic/component/ai-translation-fields/ai-translation-fields';
import { ModalFormFooter } from '../../../@generic/component/modal-form-footer/modal-form-footer';
import { ModalFormMergeButton } from '../../../@generic/component/modal-form-merge-button/modal-form-merge-button';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';
import { useAiTranslationFields } from '../../../@generic/hook/use-ai-translation-fields.hook';
import { useRegenerateTranslation } from '../../../@generic/hook/use-regenerate-translation.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useChatModelStatus } from '../../../ai/hook/use-chat-model-status.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useCategorySelectorModal } from '../../context/category-selector-modal.context';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { createCategory } from '../../utils/create-category.util';
import { getCategoryIconTerms } from '../../utils/get-category-icon-terms.util';
import { updateCategory } from '../../utils/update-category.util';
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
    const [openIconSelector] = useIconSelectorModal();
    const { regenerate, isRegenerating } = useRegenerateTranslation((id, titleEn, titleTags) =>
        Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.updateTranslation(id, titleEn, titleTags))
    );
    const isTranslationsEnabled = useSetting('isAiTranslationsEnabled');
    const { isChatReady, modelStatus } = useChatModelStatus();

    const { handleSubmit, setValue, icon, title } = useCategoryForm(category ?? null, defaultTitle);

    const isEditing = isDefined(category?.id);

    const { titleEn, titleTags, handleTitleBlur, translationFieldsProps } = useAiTranslationFields({
        entity: category ?? null,
        entityId: category?.id ?? 0,
        currentTitle: title,
        regenerate,
        isRegenerating,
        isModelReady: isTranslationsEnabled && isChatReady
    });

    const isSaveDisabled = !isNotEmptyString(title);
    const headerTitle = isEditing ? t`Edit Category` : t`Create Category`;

    const iconTerms = getCategoryIconTerms({ title, titleEn, titleTags });

    const handleIconSelect = (selectedIcon: UserIconType) => void setValue('icon', selectedIcon);

    const handleIconPress = () => {
        openIconSelector({ selectedIcon: icon, keywords: iconTerms }, selectedIcon => {
            if (isDefined(selectedIcon)) {
                handleIconSelect(selectedIcon);
            }
        });
    };

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    const mergeInto = async (sourceCategoryId: number, targetCategoryId: number) => {
        try {
            const targetCategory = await appRuntime.runPromise(
                Effect.gen(function* () {
                    const categoryRepository = yield* CategoryRepository;
                    const categoryService = yield* CategoryService;
                    const [foundCategory] = yield* categoryRepository.findById(targetCategoryId, language);
                    yield* categoryService.mergeInto(sourceCategoryId, targetCategoryId);

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

    const handleMerge = () => {
        const sourceCategoryId = category?.id;

        if (!isDefined(sourceCategoryId)) {
            return;
        }

        openCategorySelector(
            {
                excludeCategoryIds: [sourceCategoryId],
                description: t`Select a category to merge into`,
                variant: 'primary'
            },
            targetCategoryId => {
                if (isDefined(targetCategoryId)) {
                    void mergeInto(sourceCategoryId, targetCategoryId);
                }
            }
        );
    };

    const handleEditSubmit = async (categoryId: number, values: CategoryCreateEntityInterface): Promise<void> => {
        const savedCategory = await appRuntime.runPromise(updateCategory(categoryId, values, { titleEn, titleTags }, language));

        onSuccess({ category: savedCategory, action: 'updated' });
    };

    const handleCreateSubmit = async (values: CategoryCreateEntityInterface): Promise<void> => {
        const savedCategory = await appRuntime.runPromise(createCategory(values, { titleEn, titleTags }));

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

                <AiTranslationFields {...translationFieldsProps} isRegenerating={isRegenerating} modelStatus={modelStatus} />
            </KeyboardAwareScrollView>

            <ModalFormFooter
                onCancel={onCancel}
                onSave={handleFormSubmit}
                isSaveDisabled={isSaveDisabled}
                saveTestID={CategoryFormSelector.Submit}
            >
                {isEditing ? (
                    <ModalFormMergeButton
                        testID={CategoryFormSelector.Merge}
                        onPress={handleMerge}
                        content={t`Merge into another category`}
                    />
                ) : null}
            </ModalFormFooter>
        </ModalPage>
    );
};
