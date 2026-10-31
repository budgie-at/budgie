import {
    CATEGORY_TITLE_MAX_LENGTH,
    CategoryCreateEntityInterface,
    CategoryEntityInterface,
    CategoryRepository,
    UserIconType
} from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AiTranslationFields } from '../../../@generic/component/ai-translation-fields/ai-translation-fields';
import { EntityFormPage } from '../../../@generic/component/entity-form-page/entity-form-page';
import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconTitleField } from '../../../@generic/component/icon-title-field/icon-title-field';
import { MergeDeleteSection } from '../../../@generic/component/merge-delete-section/merge-delete-section';
import { ModalFormSaveBar } from '../../../@generic/component/modal-form-save-bar/modal-form-save-bar';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';
import { useAiTranslationFields } from '../../../@generic/hook/use-ai-translation-fields.hook';
import { useRegenerateTranslation } from '../../../@generic/hook/use-regenerate-translation.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useChatModelStatus } from '../../../ai/hook/use-chat-model-status.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useCategorySelectorModal } from '../../context/category-selector-modal.context';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { useDeleteCategory } from '../../hooks/use-delete-category.hook';
import { createCategory } from '../../utils/create-category.util';
import { getCategoryIconTerms } from '../../utils/get-category-icon-terms.util';
import { updateCategory } from '../../utils/update-category.util';

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
    const { run, isLoading } = useSingleFlight();
    const deleteCategory = useDeleteCategory();
    const [openIconSelector] = useIconSelectorModal();
    const { regenerate, isRegenerating } = useRegenerateTranslation((id, titleEn, titleTags) =>
        Effect.flatMap(CategoryRepository, categoryRepository => categoryRepository.updateTranslation(id, titleEn, titleTags))
    );
    const isTranslationsEnabled = useSetting('isAiTranslationsEnabled');
    const { isChatReady } = useChatModelStatus();

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

    const isChanged =
        !isDefined(category) ||
        title !== category.title ||
        icon !== category.icon ||
        titleEn !== category.titleEn ||
        titleTags !== category.titleTags;
    const isSaveDisabled = !isNotEmptyString(title) || !isChanged;
    const headerTitle = isEditing ? t`Edit Category` : t`Create Category`;
    const saveLabel = isEditing ? t`Save changes` : t`Create category`;

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

    const mergeInto = (sourceCategoryId: number, targetCategoryId: number) =>
        Effect.gen(function* () {
            const categoryRepository = yield* CategoryRepository;
            const categoryService = yield* CategoryService;
            const [targetCategory] = yield* categoryRepository.findById(targetCategoryId, language);
            yield* categoryService.mergeInto(sourceCategoryId, targetCategoryId);

            if (isDefined(targetCategory)) {
                onSuccess({ category: targetCategory, action: 'merged' });
            }
        }).pipe(toastOnFailure(t`Could not merge category`, t`Please try again later`));

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
                    void run(mergeInto(sourceCategoryId, targetCategoryId));
                }
            }
        );
    };

    const submitCategory = (values: CategoryCreateEntityInterface) =>
        Effect.gen(function* () {
            if (isDefined(category)) {
                const updatedCategory = yield* updateCategory(category.id, values, { titleEn, titleTags }, language);
                onSuccess({ category: updatedCategory, action: 'updated' });
            } else {
                const createdCategory = yield* createCategory(values, { titleEn, titleTags });
                onSuccess({ category: createdCategory, action: 'created' });
            }
        }).pipe(toastOnFailure(isEditing ? t`Could not save category` : t`Could not create category`, t`Please try again later`));

    const handleDelete = () => {
        if (isDefined(category)) {
            void run(deleteCategory(category.id).pipe(Effect.tap(isDeleted => (isDeleted ? Effect.sync(onCancel) : Effect.void))));
        }
    };

    const handleFormSubmit = handleSubmit(values => run(submitCategory(values)));

    return (
        <EntityFormPage
            title={headerTitle}
            onCancel={onCancel}
            scrollTestID={CategoryFormSelector.ScrollView}
            footer={
                <ModalFormSaveBar
                    label={saveLabel}
                    onPress={handleFormSubmit}
                    isLoading={isLoading}
                    isDisabled={isSaveDisabled}
                    testID={CategoryFormSelector.Submit}
                />
            }
        >
            <GroupedListSection title={t`Details`}>
                <IconTitleField
                    icon={icon}
                    variant="default"
                    label={t`Name`}
                    onIconPress={handleIconPress}
                    iconTriggerTestID={CategoryFormSelector.IconTrigger}
                    iconTestID={CategoryFormSelector.CurrentIcon(icon)}
                >
                    <FormTitleInput
                        autoFocus={!isEditing}
                        value={title}
                        onChangeText={handleTitleChange}
                        onBlur={handleTitleBlur}
                        maxLength={CATEGORY_TITLE_MAX_LENGTH}
                        placeholder={t`e.g. Groceries, Entertainment`}
                        accessibilityLabel={t`Category name`}
                        testID={CategoryFormSelector.Input}
                    />
                </IconTitleField>
            </GroupedListSection>

            <AiTranslationFields {...translationFieldsProps} isRegenerating={isRegenerating} />

            {isEditing ? (
                <MergeDeleteSection
                    mergeLabel={t`Merge into another category…`}
                    onMerge={handleMerge}
                    mergeTestID={CategoryFormSelector.Merge}
                    deleteLabel={t`Delete category`}
                    deleteConfirmTitle={t`Delete this category?`}
                    onDelete={handleDelete}
                />
            ) : null}
        </EntityFormPage>
    );
};
