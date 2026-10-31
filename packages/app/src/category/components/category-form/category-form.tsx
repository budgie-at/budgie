import {
    CATEGORY_TITLE_MAX_LENGTH,
    CategoryCreateEntityInterface,
    CategoryEntityInterface,
    DEFAULT_CATEGORY_ICON,
    UserIconType
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { EntityEditSections } from '../../../@generic/component/entity-edit-sections/entity-edit-sections';
import { EntityFormPage } from '../../../@generic/component/entity-form-page/entity-form-page';
import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconTitleField } from '../../../@generic/component/icon-title-field/icon-title-field';
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
import { useMergeCategory } from '../../hooks/use-merge-category.hook';
import { categoryUsageAtom } from '../../query/use-custom-categories-with-usage.query';
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
    const saveFlight = useSingleFlight();
    const operation = useEntityOperation();
    const usageResult = useLiveAtomValue(categoryUsageAtom);
    const deleteCategory = useDeleteCategory();
    const mergeCategory = useMergeCategory();
    const [openIconSelector] = useIconSelectorModal();
    const iconSearchEntries = useIconSearchEntries();

    const { handleSubmit, setValue, icon, title } = useCategoryForm(category ?? null, defaultTitle);

    const isEditing = isDefined(category);
    const [isIconChosen, setIsIconChosen] = useState(isEditing && category.icon !== DEFAULT_CATEGORY_ICON);
    const isBusy = saveFlight.isLoading || operation.isPending;
    const transactionCount = AsyncResult.getOrElse(usageResult, () => []).find(entry => entry.id === category?.id)?.transactionCount;

    const iconTerms = getCategoryIconTerms({ title, titleEn: category?.titleEn ?? null, titleTags: category?.titleTags ?? null });
    const suggestedIcon = iconSearchService.rank(iconSearchEntries, iconTerms).at(0)?.icon;
    const resolvedIcon = isIconChosen || !isDefined(suggestedIcon) ? icon : suggestedIcon;

    const isChanged = !isDefined(category) || title !== category.title || resolvedIcon !== category.icon;
    const isSaveDisabled = !isNotEmptyString(title) || operation.isPending;
    const deleteLabel = isPositiveNumber(transactionCount) ? t`Move transactions and delete…` : t`Delete category`;
    const headerTitle = isEditing ? t`Edit Category` : t`Create Category`;
    const saveLabel = isEditing ? t`Save changes` : t`Create category`;

    const handleIconPress = () => {
        if (isBusy) {
            return;
        }

        openIconSelector({ selectedIcon: resolvedIcon, keywords: iconTerms }, selectedIcon => {
            if (isDefined(selectedIcon)) {
                setIsIconChosen(true);
                setValue('icon', selectedIcon);
            }
        });
    };

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    const handleMerge = () => {
        if (isDefined(category)) {
            operation.start(EntityOperationEnum.MERGE, trackMutation =>
                mergeCategory(category.id, trackMutation).pipe(
                    Effect.tap(target =>
                        isDefined(target) ? Effect.sync(() => void onSuccess({ category: target, action: 'merged' })) : Effect.void
                    )
                )
            );
        }
    };

    const submitCategory = (values: CategoryCreateEntityInterface, submittedIcon: UserIconType) =>
        Effect.gen(function* () {
            const input = { ...values, icon: submittedIcon };

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
            <GroupedListSection title={t`Details`}>
                <IconTitleField
                    icon={resolvedIcon}
                    variant="secondary"
                    label={t`Name`}
                    onIconPress={handleIconPress}
                    iconTriggerTestID={CategoryFormSelector.IconTrigger}
                    iconTestID={CategoryFormSelector.CurrentIcon(resolvedIcon)}
                >
                    <FormTitleInput
                        autoFocus={!isEditing}
                        editable={!isBusy}
                        value={title}
                        onChangeText={handleTitleChange}
                        maxLength={CATEGORY_TITLE_MAX_LENGTH}
                        placeholder={t`e.g. Groceries, Entertainment`}
                        accessibilityLabel={t`Category name`}
                        testID={CategoryFormSelector.Input}
                    />
                </IconTitleField>
            </GroupedListSection>

            {isDefined(category) ? (
                <EntityEditSections
                    entity={category}
                    mergeLabel={t`Merge into another category…`}
                    onMerge={handleMerge}
                    mergeTestID={CategoryFormSelector.Merge}
                    deleteLabel={deleteLabel}
                    onDelete={handleDelete}
                    isDisabled={isBusy}
                    mutatingOperation={operation.mutatingOperation}
                />
            ) : null}
        </EntityFormPage>
    );
};
