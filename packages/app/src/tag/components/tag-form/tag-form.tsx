import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { EntityEditSections } from '../../../@generic/component/entity-edit-sections/entity-edit-sections';
import { EntityFormHero } from '../../../@generic/component/entity-form-hero/entity-form-hero';
import { EntityHeroFormPage } from '../../../@generic/component/entity-hero-form-page/entity-hero-form-page';
import { FormTitleInput } from '../../../@generic/component/form-title-input/form-title-input';
import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconTitleField } from '../../../@generic/component/icon-title-field/icon-title-field';
import { Icon } from '../../../@generic/component/icon/icon';
import { EntityFormStatusContext } from '../../../@generic/context/entity-form-status.context';
import { EntityOperationEnum } from '../../../@generic/enum/entity-operation.enum';
import { useEntityFormState } from '../../../@generic/hook/use-entity-form-state.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { TagMonogramSizeEnum } from '../../enum/tag-monogram-size.enum';
import { useDeleteTag } from '../../hooks/use-delete-tag.hook';
import { useMergeTag } from '../../hooks/use-merge-tag.hook';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { tagUsageAtom } from '../../query/use-tags-with-usage.query';
import { TagService } from '../../service/tag.service';
import { TagMonogram } from '../tag-monogram/tag-monogram';

import { TagFormSelector } from './tag-form.selector';

import type { TagFormResultInterface } from '../../interface/tag-form-result.interface';

interface Props {
    readonly tag?: TagEntityInterface;
    readonly defaultTitle?: string;
    readonly onSuccess: (result: TagFormResultInterface) => void;
    readonly onCancel: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const TagForm = (props: Props) => {
    const { tag, defaultTitle, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const deleteTag = useDeleteTag();
    const mergeTag = useMergeTag();

    const { handleSubmit, setValue, formState, title } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));
    const form = useEntityFormState(tag?.id, tagUsageAtom, title, onCancel);
    const { transactionCount } = form;
    const { isBusy, isReady: hasTitle } = form.status;

    const isEditing = isDefined(tag);
    const isChanged = !isDefined(tag) || title !== tag.title;
    const createLabel = hasTitle ? t`Create tag` : t`Add a name to continue`;
    const titleError = isDefined(formState.errors.title) ? t`Use 1 to ${TAG_TITLE_MAX_LENGTH} characters` : void 0;
    const saveLabel = isEditing ? t`Save changes` : createLabel;
    const heroFallbackTitle = isEditing ? t`Edit tag` : t`New tag`;
    const heroSubtitle = isEditing ? t`Rename it or merge it into another` : t`Name it to group transactions`;
    const deleteFooter = isPositiveNumber(transactionCount)
        ? t({
              message: plural(transactionCount, {
                  one: 'Removed from # transaction. The transaction stays.',
                  other: 'Removed from # transactions. The transactions stay.'
              })
          })
        : t`Not on any transactions. This can’t be undone.`;
    const tagTitle = tag?.title ?? '';
    const mergeFooter = isPositiveNumber(transactionCount)
        ? t({
              message: plural(transactionCount, {
                  one: `Its # transaction gets the tag you pick, and “${tagTitle}” is removed.`,
                  other: `Its # transactions get the tag you pick, and “${tagTitle}” is removed.`
              })
          })
        : null;

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    const handleMerge = () => {
        if (isDefined(tag) && !isBusy) {
            form.startOperation(EntityOperationEnum.MERGE, trackMutation =>
                mergeTag(tag.id, trackMutation).pipe(
                    Effect.tap(target => (isDefined(target) ? Effect.sync(() => void onSuccess({ tag: target })) : Effect.void))
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
                onSuccess({ tag: updatedTag });
            } else {
                const createdTag = yield* tagService.create(values, null, null);
                onSuccess({ tag: createdTag });
            }
        }).pipe(toastOnFailure(isEditing ? t`Could not save tag` : t`Could not create tag`, t`Please try again later`));

    const handleDelete = () => void form.startDelete(deleteTag);
    const handleFormSubmit = handleSubmit(values => form.runSave(submitTag(values)));

    return (
        <EntityFormStatusContext value={form.status}>
            <EntityHeroFormPage
                entity={tag}
                hero={
                    <EntityFormHero
                        title={title}
                        subtitle={heroSubtitle}
                        fallbackTitle={heroFallbackTitle}
                        icon={<TagMonogram title={title} size={TagMonogramSizeEnum.LARGE} />}
                    />
                }
                titleField={
                    <IconTitleField label={t`Name`} error={titleError}>
                        <FormTitleInput
                            placeholder={t`e.g. Business, Personal, Vacation`}
                            accessibilityLabel={t`Tag name`}
                            testID={TagFormSelector.Input}
                            maxLength={TAG_TITLE_MAX_LENGTH}
                            autoFocus={!isEditing}
                            editable={!isBusy}
                            value={title}
                            onChangeText={handleTitleChange}
                        />
                    </IconTitleField>
                }
                submitLabel={saveLabel}
                submitTestID={TagFormSelector.Submit}
                onSubmit={handleFormSubmit}
                onCancel={onCancel}
            >
                <EntityEditSections
                    deleteLabel={t`Delete tag`}
                    deleteFooter={deleteFooter}
                    deleteTestID={TagFormSelector.Delete}
                    onDelete={handleDelete}
                >
                    {isPositiveNumber(transactionCount) ? (
                        <GroupedListSection footer={mergeFooter}>
                            <GroupedListActionRow
                                label={t`Merge into another tag…`}
                                icon={UserIconNameEnum.GitMerge}
                                onPress={handleMerge}
                                isDisabled={isBusy}
                                isLoading={form.status.mutatingOperation === EntityOperationEnum.MERGE}
                                labelClassName="text-primary"
                                trailing={<Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />}
                                testID={TagFormSelector.Merge}
                            />
                        </GroupedListSection>
                    ) : null}
                </EntityEditSections>
            </EntityHeroFormPage>
        </EntityFormStatusContext>
    );
};
