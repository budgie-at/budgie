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
import { useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { EntityEditSections } from '../../../@generic/component/entity-edit-sections/entity-edit-sections';
import { EntityFormHero } from '../../../@generic/component/entity-form-hero/entity-form-hero';
import { EntityHeroFormPage } from '../../../@generic/component/entity-hero-form-page/entity-hero-form-page';
import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { IconTitleField } from '../../../@generic/component/icon-title-field/icon-title-field';
import { Icon } from '../../../@generic/component/icon/icon';
import { EntityFormStatusContext } from '../../../@generic/context/entity-form-status.context';
import { useEntityFormState } from '../../../@generic/hook/use-entity-form-state.hook';
import { useIconSearchEntries } from '../../../@generic/hook/use-icon-search-entries.hook';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { PLACEHOLDER_CATEGORY_ICONS } from '../../constant/placeholder-category-icon.constant';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { useDeleteCategory } from '../../hooks/use-delete-category.hook';
import { categoryUsageAtom } from '../../query/use-categories-with-usage.query';
import { createCategory } from '../../utils/create-category.util';
import { getCategoryDeleteCopy } from '../../utils/get-category-delete-copy.util';
import { getCategoryDisplayIcon } from '../../utils/get-category-display-icon.util';
import { suggestCategoryIcon } from '../../utils/suggest-category-icon.util';
import { updateCategory } from '../../utils/update-category.util';
import { CategoryFormHeroIcon } from '../category-form-hero-icon/category-form-hero-icon';

import { CategoryFormSelector } from './category-form.selector';

import type { CategoryFormResultInterface } from '../../interface/category-form-result.interface';

interface Props {
    readonly category?: CategoryEntityInterface;
    readonly defaultTitle?: string;
    readonly syncZone?: string;
    readonly onSuccess: (result: CategoryFormResultInterface) => void;
    readonly onCancel: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const CategoryForm = (props: Props) => {
    const { category, defaultTitle, syncZone, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const language = useSetting('language');
    const deleteCategory = useDeleteCategory();
    const openIconSelector = useOpenModal('/icon-selector');
    const iconSearchEntries = useIconSearchEntries();

    const { handleSubmit, setValue, formState, icon, title } = useCategoryForm(category ?? null, defaultTitle);
    const form = useEntityFormState(category?.id, categoryUsageAtom, title, onCancel);
    const { transactionCount } = form;
    const { isBusy, isReady: hasTitle } = form.status;

    const isEditing = isDefined(category);
    const [hasPickedIcon, setHasPickedIcon] = useState(false);
    const iconSource = hasPickedIcon ? CategoryIconSourceEnum.USER : (category?.iconSource ?? CategoryIconSourceEnum.AUTO);
    const isIconChosen = iconSource === CategoryIconSourceEnum.USER;

    const autoIcon = suggestCategoryIcon(iconSearchEntries, category, title);
    const resolvedIcon = isIconChosen ? icon : autoIcon.icon;
    const triggerIcon = hasPickedIcon || !isDefined(category) ? resolvedIcon : getCategoryDisplayIcon({ ...category, icon: resolvedIcon });

    const isChanged =
        !isDefined(category) || title !== category.title || resolvedIcon !== category.icon || iconSource !== category.iconSource;
    const deleteCopy = getCategoryDeleteCopy(transactionCount, t);
    const heroFallbackTitle = isEditing ? t`Edit category` : t`New category`;
    const heroSubtitle = isEditing ? t`Rename it or change its icon` : t`Name it and pick an icon`;
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

        openIconSelector(
            { selectedIcon: resolvedIcon, keywords: autoIcon.terms, excludedIcons: PLACEHOLDER_CATEGORY_ICONS },
            selectedIcon => {
                if (isDefined(selectedIcon)) {
                    setHasPickedIcon(true);
                    setValue('icon', selectedIcon);
                }
            }
        );
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
                onSuccess({ category: updatedCategory });
            } else {
                const createdCategory = yield* createCategory({ ...input, syncZone }, { titleEn: null, titleTags: null });
                onSuccess({ category: createdCategory });
            }
        }).pipe(toastOnFailure(isEditing ? t`Could not save category` : t`Could not create category`, t`Please try again later`));

    const handleDelete = () => void form.startDelete(deleteCategory);
    const handleFormSubmit = handleSubmit(values => form.runSave(submitCategory(values, resolvedIcon)));

    return (
        <EntityFormStatusContext value={form.status}>
            <EntityHeroFormPage
                entity={category}
                hero={
                    <EntityFormHero
                        icon={<CategoryFormHeroIcon icon={triggerIcon} onPress={handleIconPress} />}
                        title={title}
                        fallbackTitle={heroFallbackTitle}
                        subtitle={heroSubtitle}
                    />
                }
                titleField={
                    <IconTitleField label={t`Name`} error={titleError}>
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
                }
                submitLabel={saveLabel}
                submitTestID={CategoryFormSelector.Submit}
                onSubmit={handleFormSubmit}
                onCancel={onCancel}
            >
                <EntityEditSections
                    deleteLabel={deleteCopy.label}
                    deleteFooter={deleteCopy.footer}
                    deleteTestID={CategoryFormSelector.Delete}
                    deleteTrailing={deleteTrailing}
                    onDelete={handleDelete}
                />
            </EntityHeroFormPage>
        </EntityFormStatusContext>
    );
};
