import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AiTranslationFields } from '../../../@generic/component/ai-translation-fields/ai-translation-fields';
import { EntityEditSections } from '../../../@generic/component/entity-edit-sections/entity-edit-sections';
import { EntityFormPage } from '../../../@generic/component/entity-form-page/entity-form-page';
import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconTitleField } from '../../../@generic/component/icon-title-field/icon-title-field';
import { EntityOperationEnum } from '../../../@generic/enum/entity-operation.enum';
import { useEntityOperation } from '../../../@generic/hook/use-entity-operation.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useDeleteTag } from '../../hooks/use-delete-tag.hook';
import { useMergeTag } from '../../hooks/use-merge-tag.hook';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { TagService } from '../../service/tag.service';
import { TagMonogram } from '../tag-monogram/tag-monogram';

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

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const TagForm = (props: Props) => {
    const { tag, defaultTitle, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const saveFlight = useSingleFlight();
    const operation = useEntityOperation();
    const deleteTag = useDeleteTag();
    const mergeTag = useMergeTag();

    const { handleSubmit, setValue, title } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));

    const isEditing = isDefined(tag);
    const isBusy = saveFlight.isLoading || operation.isPending;
    const isChanged = !isDefined(tag) || title !== tag.title;
    const isSaveDisabled = !isNotEmptyString(title) || operation.isPending;
    const headerTitle = isEditing ? t`Edit Tag` : t`Create Tag`;
    const saveLabel = isEditing ? t`Save changes` : t`Create tag`;

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    const handleMerge = () => {
        if (isDefined(tag)) {
            operation.start(EntityOperationEnum.MERGE, trackMutation =>
                mergeTag(tag.id, trackMutation).pipe(
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

            if (isDefined(tag) && !isChanged) {
                onCancel();
            } else if (isDefined(tag)) {
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
            operation.start(EntityOperationEnum.DELETE, trackMutation =>
                deleteTag(tag.id, trackMutation).pipe(Effect.tap(isDeleted => (isDeleted ? Effect.sync(onCancel) : Effect.void)))
            );
        }
    };

    const keywordsFooter = isDefined(tag) ? (
        <AiTranslationFields title={tag.title} titleEn={tag.titleEn} titleTags={tag.titleTags} />
    ) : null;

    const handleFormSubmit = handleSubmit(values => saveFlight.run(submitTag(values)));

    return (
        <EntityFormPage
            title={headerTitle}
            onCancel={onCancel}
            saveLabel={saveLabel}
            onSave={handleFormSubmit}
            isSaving={saveFlight.isLoading}
            isSaveDisabled={isSaveDisabled}
            saveTestID={TagFormSelector.Submit}
        >
            <GroupedListSection title={t`Details`} footer={keywordsFooter}>
                <IconTitleField tile={<TagMonogram title={title} />} label={t`Name`}>
                    <FormTitleInput
                        autoFocus={!isEditing}
                        editable={!isBusy}
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
                    deleteLabel={t`Delete tag`}
                    onDelete={handleDelete}
                    isDisabled={isBusy}
                    mutatingOperation={operation.mutatingOperation}
                >
                    <GroupedListActionRow
                        label={t`Merge into another tag…`}
                        onPress={handleMerge}
                        isDisabled={isBusy}
                        isLoading={operation.mutatingOperation === EntityOperationEnum.MERGE}
                        labelClassName="text-primary"
                        testID={TagFormSelector.Merge}
                    />
                </EntityEditSections>
            ) : null}
        </EntityFormPage>
    );
};
