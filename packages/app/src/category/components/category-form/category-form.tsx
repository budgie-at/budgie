import {
    CATEGORY_TITLE_MAX_LENGTH,
    CategoryCreateEntityInterface,
    CategoryEntityInterface,
    CategoryIconSourceEnum,
    UserIconNameEnum,
    UserIconType
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { AiTranslationFields } from '../../../@generic/component/ai-translation-fields/ai-translation-fields';
import { EntityEditSections } from '../../../@generic/component/entity-edit-sections/entity-edit-sections';
import { EntityFormPage } from '../../../@generic/component/entity-form-page/entity-form-page';
import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconTitleFieldTrigger } from '../../../@generic/component/icon-title-field-trigger/icon-title-field-trigger';
import { IconTitleField } from '../../../@generic/component/icon-title-field/icon-title-field';
import { Icon } from '../../../@generic/component/icon/icon';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';
import { EntityOperationEnum } from '../../../@generic/enum/entity-operation.enum';
import { useEntityOperation } from '../../../@generic/hook/use-entity-operation.hook';
import { useIconSearchEntries } from '../../../@generic/hook/use-icon-search-entries.hook';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { iconSearchService } from '../../../@generic/service/icon-search.service';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { useDeleteCategory } from '../../hooks/use-delete-category.hook';
import { categoryUsageAtom } from '../../query/use-categories-with-usage.query';
import { createCategory } from '../../utils/create-category.util';
import { getCategoryDeleteCopy } from '../../utils/get-category-delete-copy.util';
import { getCategoryDisplayIcon } from '../../utils/get-category-display-icon.util';
import { getCategoryIconTerms } from '../../utils/get-category-icon-terms.util';
import { updateCategory } from '../../utils/update-category.util';

import { CategoryFormSelector } from './category-form.selector';

type CategoryFormAction = 'created' | 'updated' | 'cancelled';

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
    const saveFlight = useSingleFlight();
    const operation = useEntityOperation();
    const usageResult = useLiveAtomValue(categoryUsageAtom);
    const deleteCategory = useDeleteCategory();
    const [openIconSelector] = useIconSelectorModal();
    const iconSearchEntries = useIconSearchEntries();

    const { handleSubmit, setValue, formState, icon, title } = useCategoryForm(category ?? null, defaultTitle);

    const isEditing = isDefined(category);
    const [hasPickedIcon, setHasPickedIcon] = useState(false);
    const iconSource = hasPickedIcon ? CategoryIconSourceEnum.USER : (category?.iconSource ?? CategoryIconSourceEnum.AUTO);
    const isIconChosen = iconSource === CategoryIconSourceEnum.USER;
    const hasTitle = isNotEmptyString(title.trim());
    const isBusy = saveFlight.isLoading || operation.isPending;
    const transactionCount = AsyncResult.isSuccess(usageResult)
        ? (usageResult.value.find(entry => entry.id === category?.id)?.transactionCount ?? 0)
        : null;

    const iconTerms = getCategoryIconTerms({ titleEn: null, titleTags: null, ...category, title });
    const suggestedIcon = iconSearchService.findConfidentIcon(iconSearchEntries, iconTerms);
    const resolvedIcon = isIconChosen || !isDefined(suggestedIcon) ? icon : suggestedIcon;
    const triggerIcon = hasPickedIcon || !isDefined(category) ? resolvedIcon : getCategoryDisplayIcon({ ...category, icon: resolvedIcon });

    const isChanged =
        !isDefined(category) || title !== category.title || resolvedIcon !== category.icon || iconSource !== category.iconSource;
    const isSaveDisabled = !hasTitle || operation.isPending;
    const deleteCopy = getCategoryDeleteCopy(transactionCount, t);
    const headerTitle = isEditing ? t`Edit Category` : t`Create Category`;
    const createLabel = hasTitle ? t`Create category` : t`Add a name to continue`;
    const titleError = isDefined(formState.errors.title) ? t`Use 1 to ${CATEGORY_TITLE_MAX_LENGTH} characters` : void 0;
    const deleteTrailing = isPositiveNumber(transactionCount) ? (
        <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
    ) : null;
    const saveLabel = isEditing ? t`Save changes` : createLabel;

    const handleIconPress = () => {
        if (isBusy) {
            return;
        }

        openIconSelector({ selectedIcon: resolvedIcon, keywords: iconTerms }, selectedIcon => {
            if (isDefined(selectedIcon)) {
                setHasPickedIcon(true);
                setValue('icon', selectedIcon);
            }
        });
    };

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    const submitCategory = (values: CategoryCreateEntityInterface, submittedIcon: UserIconType) =>
        Effect.gen(function* () {
            const input = { ...values, icon: submittedIcon, iconSource };

            if (isDefined(category) && !isChanged) {
                onCancel();
            } else if (isDefined(category)) {
                const isTitleChanged = values.title !== category.title;
                const translation = isTitleChanged ? { titleEn: null, titleTags: null } : category;
                const updatedCategory = yield* updateCategory(category.id, input, translation, language);
                onSuccess({ category: updatedCategory, action: 'updated' });
            } else {
                const createdCategory = yield* createCategory(input, { titleEn: null, titleTags: null });
                onSuccess({ category: createdCategory, action: 'created' });
            }
        }).pipe(toastOnFailure(isEditing ? t`Could not save category` : t`Could not create category`, t`Please try again later`));

    const handleDelete = () => {
        if (isDefined(category)) {
            operation.start(EntityOperationEnum.DELETE, trackMutation =>
                deleteCategory(category.id, trackMutation).pipe(Effect.tap(isDeleted => (isDeleted ? Effect.sync(onCancel) : Effect.void)))
            );
        }
    };

    const keywordsFooter = isDefined(category) ? (
        <AiTranslationFields title={category.title} titleEn={category.titleEn} titleTags={category.titleTags} />
    ) : null;

    const handleFormSubmit = handleSubmit(values => saveFlight.run(submitCategory(values, resolvedIcon)));

    return (
        <EntityFormPage
            title={headerTitle}
            onCancel={onCancel}
            saveLabel={saveLabel}
            onSave={handleFormSubmit}
            isSaving={saveFlight.isLoading}
            isSaveDisabled={isSaveDisabled}
            saveTestID={CategoryFormSelector.Submit}
        >
            <GroupedListSection title={t`Details`} footer={keywordsFooter}>
                <IconTitleField
                    tile={
                        <IconTitleFieldTrigger
                            icon={triggerIcon}
                            variant="secondary"
                            onPress={handleIconPress}
                            testID={CategoryFormSelector.IconTrigger}
                            iconTestID={CategoryFormSelector.CurrentIcon(triggerIcon)}
                        />
                    }
                    label={t`Name`}
                    error={titleError}
                >
                    <FormTitleInput
                        autoFocus={!isEditing}
                        editable={!isBusy}
                        value={title}
                        onChangeText={handleTitleChange}
                        maxLength={CATEGORY_TITLE_MAX_LENGTH}
                        placeholder={t`e.g. Climbing, Side project`}
                        accessibilityLabel={t`Category name`}
                        testID={CategoryFormSelector.Input}
                    />
                </IconTitleField>
            </GroupedListSection>

            {isDefined(category) ? (
                <EntityEditSections
                    deleteLabel={deleteCopy.label}
                    deleteFooter={deleteCopy.footer}
                    deleteTestID={CategoryFormSelector.Delete}
                    deleteTrailing={deleteTrailing}
                    onDelete={handleDelete}
                    isDisabled={isBusy}
                    mutatingOperation={operation.mutatingOperation}
                />
            ) : null}
        </EntityFormPage>
    );
};
