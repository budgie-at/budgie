import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { AiTranslationFields } from '../../../@generic/component/ai-translation-fields/ai-translation-fields';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { ModalFormCancelButton } from '../../../@generic/component/modal-form-cancel-button/modal-form-cancel-button';
import { ModalFormMergeButton } from '../../../@generic/component/modal-form-merge-button/modal-form-merge-button';
import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { useAiTranslationFields } from '../../../@generic/hook/use-ai-translation-fields.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useChatModelStatus } from '../../../ai/hook/use-chat-model-status.hook';
import { useNoteInputModal } from '../../../transaction/context/note-input-modal.context';
import { useTagsSelectorModal } from '../../context/tags-selector-modal.context';
import { useRegenerateTagTranslation } from '../../hooks/use-regenerate-tag-translation.hook';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { tagService } from '../../service/tag.service';

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

const TITLE_ANIMATION_DELAY = 100;

// eslint-disable-next-line max-lines-per-function, max-statements -- Form orchestration component with multiple hooks and handlers
export const TagForm = (props: Props) => {
    const { tag, defaultTitle, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();
    const [openNoteInput] = useNoteInputModal();
    const { regenerate, isRegenerating } = useRegenerateTagTranslation();
    const { isChatReady, modelStatus } = useChatModelStatus();

    const { handleSubmit, setValue, title } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));

    const isEditing = isDefined(tag?.id);

    const { titleEn, titleTags, setTitleEn, setTitleTags, isGenerateDisabled, handleRegenerate, handleTitleBlur } = useAiTranslationFields({
        entity: tag ?? null,
        entityId: tag?.id ?? 0,
        currentTitle: title,
        regenerate,
        isRegenerating,
        isModelReady: isChatReady
    });

    const isSaveDisabled = !isNotEmptyString(title);
    const headerTitle = isEditing ? t`Edit Tag` : t`Create Tag`;

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

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    const handleMerge = async () => {
        if (!isDefined(tag?.id)) {
            return;
        }

        const targetTagIds = await openTagsSelector({
            excludeTagIds: [tag.id],
            description: t`Select a tag to merge into`,
            singleSelect: true
        });

        const targetTagId = isNotEmptyArray(targetTagIds) ? targetTagIds[0] : null;
        if (!isDefined(targetTagId)) {
            return;
        }

        try {
            const [targetTag] = await tagRepository.findByIds([targetTagId]);
            await tagService.mergeInto(tag.id, targetTagId);

            if (isDefined(targetTag)) {
                onSuccess({ tag: targetTag, action: 'merged' });
            }
        } catch {
            showErrorToast(t`Could not merge tag`, t`Please try again later`);
        }
    };

    const saveTagTranslation = async (tagId: number): Promise<void> => {
        const hasTranslationData = isNotEmptyString(titleEn) && isNotEmptyString(titleTags);

        if (hasTranslationData) {
            await tagRepository.updateTranslation(tagId, titleEn, titleTags);
        } else {
            await tagRepository.clearTranslation(tagId);
        }
    };

    const handleEditSubmit = async (tagId: number, values: TagCreateEntityInterface): Promise<void> => {
        const updatedTag = await tagRepository.updateById(tagId, values);
        await saveTagTranslation(tagId);

        const savedTags = await tagRepository.findByIds([tagId]);
        const savedTag = savedTags.at(0) ?? updatedTag;

        onSuccess({ tag: savedTag, action: 'updated' });
    };

    const handleCreateSubmit = async (values: TagCreateEntityInterface): Promise<void> => {
        const savedTag = await tagRepository.create(values);
        const hasTranslationData = isNotEmptyString(titleEn) && isNotEmptyString(titleTags);

        if (hasTranslationData) {
            await tagRepository.updateTranslation(savedTag.id, titleEn, titleTags);
        }

        onSuccess({ tag: savedTag, action: 'created' });
    };

    const handleFormSubmit = handleSubmit(async values => {
        try {
            if (isDefined(tag)) {
                await handleEditSubmit(tag.id, values);
            } else {
                await handleCreateSubmit(values);
            }
        } catch {
            const errorMessage = isEditing ? t`Could not save tag` : t`Could not create tag`;
            showErrorToast(errorMessage, t`Please try again later`);
        }
    });

    return (
        <ModalPage header={<PageHeader title={headerTitle} onGoBack={onCancel} />}>
            <KeyboardAwareScrollView
                testID={TagFormSelector.ScrollView}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <Animated.View entering={FadeInUp.delay(TITLE_ANIMATION_DELAY).duration(200)} className="px-3xl pt-2xl">
                    <FormItem label={t`Tag Name`}>
                        <Input
                            size="lg"
                            value={title}
                            onChangeText={handleTitleChange}
                            onBlur={handleTitleBlur}
                            maxLength={TAG_TITLE_MAX_LENGTH}
                            placeholder={t`e.g. Business, Personal, Vacation`}
                            autoCapitalize="words"
                            autoCorrect={false}
                            autoComplete="off"
                            textContentType="none"
                            spellCheck={false}
                            inputMode="text"
                            testID={TagFormSelector.Input}
                        />
                    </FormItem>
                </Animated.View>

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
            </KeyboardAwareScrollView>

            <View className="px-3xl pb-3xl gap-y-md pt-xl">
                {isEditing ? (
                    <ModalFormMergeButton testID={TagFormSelector.Merge} onPress={handleMerge} content={t`Merge into another tag`} />
                ) : null}

                <View className="flex-row gap-x-md">
                    <ModalFormCancelButton onPress={onCancel} />
                    <ModalFormSaveButton onPress={handleFormSubmit} disabled={isSaveDisabled} testID={TagFormSelector.Submit} />
                </View>
            </View>
        </ModalPage>
    );
};
