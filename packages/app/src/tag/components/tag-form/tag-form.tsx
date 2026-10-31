import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface, TagRepository } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { AiTranslationFields } from '../../../@generic/component/ai-translation-fields/ai-translation-fields';
import { EntityFormPage } from '../../../@generic/component/entity-form-page/entity-form-page';
import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { MergeDeleteSection } from '../../../@generic/component/merge-delete-section/merge-delete-section';
import { ModalFormSaveBar } from '../../../@generic/component/modal-form-save-bar/modal-form-save-bar';
import { useAiTranslationFields } from '../../../@generic/hook/use-ai-translation-fields.hook';
import { useRegenerateTranslation } from '../../../@generic/hook/use-regenerate-translation.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useChatModelStatus } from '../../../ai/hook/use-chat-model-status.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useTagsSelectorModal } from '../../context/tags-selector-modal.context';
import { useDeleteTag } from '../../hooks/use-delete-tag.hook';
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

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const TagForm = (props: Props) => {
    const { tag, defaultTitle, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();
    const { run, isLoading } = useSingleFlight();
    const deleteTag = useDeleteTag();
    const { regenerate, isRegenerating } = useRegenerateTranslation((id, titleEn, titleTags) =>
        Effect.flatMap(TagRepository, tagRepository => tagRepository.updateTranslation(id, titleEn, titleTags))
    );
    const isTranslationsEnabled = useSetting('isAiTranslationsEnabled');
    const { isChatReady } = useChatModelStatus();

    const { handleSubmit, setValue, title } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));

    const isEditing = isDefined(tag?.id);

    const { titleEn, titleTags, handleTitleBlur, translationFieldsProps } = useAiTranslationFields({
        entity: tag ?? null,
        entityId: tag?.id ?? 0,
        currentTitle: title,
        regenerate,
        isRegenerating,
        isModelReady: isTranslationsEnabled && isChatReady
    });

    const isChanged = !isDefined(tag) || title !== tag.title || titleEn !== tag.titleEn || titleTags !== tag.titleTags;
    const isSaveDisabled = !isNotEmptyString(title) || !isChanged;
    const headerTitle = isEditing ? t`Edit Tag` : t`Create Tag`;
    const saveLabel = isEditing ? t`Save changes` : t`Create tag`;

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    const handleMerge = () => {
        if (!isDefined(tag?.id)) {
            return;
        }

        const sourceTagId = tag.id;

        const mergeIntoTarget = (targetTagId: number) =>
            Effect.gen(function* () {
                const tagService = yield* TagService;
                const targetTag = yield* tagService.mergeInto(sourceTagId, targetTagId);

                if (isDefined(targetTag)) {
                    onSuccess({ tag: targetTag, action: 'merged' });
                }
            }).pipe(toastOnFailure(t`Could not merge tag`, t`Please try again later`));

        openTagsSelector(
            {
                excludeTagIds: [sourceTagId],
                description: t`Select a tag to merge into`,
                singleSelect: true
            },
            targetTagIds => {
                const targetTagId = isNotEmptyArray(targetTagIds) ? targetTagIds[0] : null;
                if (isDefined(targetTagId)) {
                    void run(mergeIntoTarget(targetTagId));
                }
            }
        );
    };

    const submitTag = (values: TagCreateEntityInterface) =>
        Effect.gen(function* () {
            const tagService = yield* TagService;

            if (isDefined(tag)) {
                const updatedTag = yield* tagService.update(tag.id, values, titleEn, titleTags);
                onSuccess({ tag: updatedTag, action: 'updated' });
            } else {
                const createdTag = yield* tagService.create(values, titleEn, titleTags);
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
            scrollTestID={TagFormSelector.ScrollView}
            footer={
                <ModalFormSaveBar
                    label={saveLabel}
                    onPress={handleFormSubmit}
                    isLoading={isLoading}
                    isDisabled={isSaveDisabled}
                    testID={TagFormSelector.Submit}
                />
            }
        >
            <GroupedListSection title={t`Name`}>
                <View className="px-3xl py-lg">
                    <FormTitleInput
                        autoFocus={!isEditing}
                        value={title}
                        onChangeText={handleTitleChange}
                        onBlur={handleTitleBlur}
                        maxLength={TAG_TITLE_MAX_LENGTH}
                        placeholder={t`e.g. Business, Personal, Vacation`}
                        accessibilityLabel={t`Tag name`}
                        testID={TagFormSelector.Input}
                    />
                </View>
            </GroupedListSection>

            <AiTranslationFields {...translationFieldsProps} isRegenerating={isRegenerating} />

            {isEditing ? (
                <MergeDeleteSection
                    mergeLabel={t`Merge into another tag…`}
                    onMerge={handleMerge}
                    mergeTestID={TagFormSelector.Merge}
                    deleteLabel={t`Delete tag`}
                    deleteConfirmTitle={t`Delete this tag?`}
                    onDelete={handleDelete}
                />
            ) : null}
        </EntityFormPage>
    );
};
