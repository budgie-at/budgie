import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { EntityEditSections } from '../../../@generic/component/entity-edit-sections/entity-edit-sections';
import { EntityFormPage } from '../../../@generic/component/entity-form-page/entity-form-page';
import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconTitleField } from '../../../@generic/component/icon-title-field/icon-title-field';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useDeleteTag } from '../../hooks/use-delete-tag.hook';
import { useMergeTag } from '../../hooks/use-merge-tag.hook';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { TagService } from '../../service/tag.service';

import { TagFormSelector } from './tag-form.selector';

type TagFormAction = 'created' | 'updated' | 'merged' | 'cancelled';

export interface TagFormResult {
    readonly tag: TagEntityInterface;
    readonly action: TagFormAction;
}

interface Props {
    readonly tag?: TagEntityInterface;
    readonly defaultTitle?: string;
    readonly onSuccess: (result: TagFormResult) => void;
    readonly onCancel: () => void;
}

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const TagForm = (props: Props) => {
    const { tag, defaultTitle, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();
    const deleteTag = useDeleteTag();
    const mergeTag = useMergeTag();

    const { handleSubmit, setValue, title } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));

    const isEditing = isDefined(tag);
    const isChanged = !isDefined(tag) || title !== tag.title;
    const isSaveDisabled = !isNotEmptyString(title) || !isChanged;
    const headerTitle = isEditing ? t`Edit Tag` : t`Create Tag`;
    const saveLabel = isEditing ? t`Save changes` : t`Create tag`;

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    const handleMerge = () => {
        if (isDefined(tag)) {
            void run(
                mergeTag(tag.id).pipe(
                    Effect.tap(target =>
                        isDefined(target) ? Effect.sync(() => void onSuccess({ tag: target, action: 'merged' })) : Effect.void
                    )
                )
            );
        }
    };

    const submitTag = (values: TagCreateEntityInterface) =>
        Effect.gen(function* () {
            const tagService = yield* TagService;

            if (isDefined(tag)) {
                const translation = values.title === tag.title ? tag : { titleEn: null, titleTags: null };
                const updatedTag = yield* tagService.update(tag.id, values, translation.titleEn, translation.titleTags);
                onSuccess({ tag: updatedTag, action: 'updated' });
            } else {
                const createdTag = yield* tagService.create(values, null, null);
                onSuccess({ tag: createdTag, action: 'created' });
            }
        }).pipe(toastOnFailure(isEditing ? t`Could not save tag` : t`Could not create tag`, t`Please try again later`));

    const handleDelete = () => {
        if (isDefined(tag)) {
            void run(deleteTag(tag.id).pipe(Effect.tap(isDeleted => (isDeleted ? Effect.sync(onCancel) : Effect.void))));
        }
    };

    const handleFormSubmit = handleSubmit(values => run(submitTag(values)));

    return (
        <EntityFormPage
            title={headerTitle}
            onCancel={onCancel}
            saveLabel={saveLabel}
            onSave={handleFormSubmit}
            isSaving={isLoading}
            isSaveDisabled={isSaveDisabled}
            saveTestID={TagFormSelector.Submit}
        >
            <GroupedListSection title={t`Details`}>
                <IconTitleField icon={UserIconNameEnum.Tag} variant="secondary" label={t`Name`}>
                    <FormTitleInput
                        autoFocus={!isEditing}
                        editable={!isLoading}
                        value={title}
                        onChangeText={handleTitleChange}
                        maxLength={TAG_TITLE_MAX_LENGTH}
                        placeholder={t`e.g. Business, Personal, Vacation`}
                        accessibilityLabel={t`Tag name`}
                        testID={TagFormSelector.Input}
                    />
                </IconTitleField>
            </GroupedListSection>

            {isDefined(tag) ? (
                <EntityEditSections
                    entity={tag}
                    mergeLabel={t`Merge into another tag…`}
                    onMerge={handleMerge}
                    mergeTestID={TagFormSelector.Merge}
                    deleteLabel={t`Delete tag`}
                    onDelete={handleDelete}
                    isDisabled={isLoading}
                />
            ) : null}
        </EntityFormPage>
    );
};
