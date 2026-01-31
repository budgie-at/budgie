import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { ModalPage } from '../../../@generic/component/page/modal-page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { CategoryAiFields } from '../../../category/components/category-ai-fields/category-ai-fields';
import { useTagsSelectorModal } from '../../context/tags-selector-modal.context';
import { useRegenerateTagTranslation } from '../../hooks/use-regenerate-tag-translation.hook';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { tagService } from '../../service/tag.service';

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
    const { openTagsSelector } = useTagsSelectorModal();
    const { regenerate, isRegenerating } = useRegenerateTagTranslation();

    const { handleSubmit, setValue, title } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));

    const isEditing = isDefined(tag?.id);

    const [titleEn, setTitleEn] = useState<string | null>(tag?.titleEn ?? null);
    const [titleTags, setTitleTags] = useState<string | null>(tag?.titleTags ?? null);

    const lastRegeneratedTitle = useRef<string>(tag?.title ?? '');

    const isSaveDisabled = !isNotEmptyString(title);
    const headerTitle = isEditing ? t`Edit Tag` : t`Create Tag`;

    const handleTitleChange = (value: string) => {
        setValue('title', value);
    };

    /* jscpd:ignore-start */
    const handleRegenerate = async () => {
        const tagId = tag?.id ?? 0;
        const result = await regenerate(tagId, title);

        if (isDefined(result)) {
            setTitleEn(result.titleEn);
            setTitleTags(result.titleTags);
            lastRegeneratedTitle.current = title;
        }
    };

    const handleTitleBlur = () => {
        const titleChanged = title !== lastRegeneratedTitle.current;
        const hasValidTitle = isNotEmptyString(title);

        if (titleChanged && hasValidTitle && !isRegenerating) {
            void handleRegenerate();
        }
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

    const handleFormSubmit = handleSubmit(async (values: TagCreateEntityInterface) => {
        try {
            if (isEditing) {
                const savedTag = await tagRepository.updateById(tag.id, { ...values, titleEn, titleTags });
                onSuccess({ tag: savedTag, action: 'updated' });
            } else {
                const savedTag = await tagRepository.create(values);
                const hasTranslationData = isNotEmptyString(titleEn) && isNotEmptyString(titleTags);

                if (hasTranslationData) {
                    await tagRepository.updateTranslation(savedTag.id, titleEn, titleTags);
                }

                onSuccess({ tag: savedTag, action: 'created' });
            }
        } catch {
            const errorMessage = isEditing ? t`Could not save tag` : t`Could not create tag`;
            showErrorToast(errorMessage, t`Please try again later`);
        }
    });

    const mergeButton = isEditing ? (
        <Button
            variant="ghost"
            size="sm"
            leftIcon={UserIconNameEnum.Merge}
            onPress={handleMerge}
            content={<Trans>Merge into another tag</Trans>}
        />
    ) : null;

    return (
        <ModalPage header={<PageHeader title={headerTitle} onGoBack={onCancel} />}>
            <View className="flex-1">
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
                        />
                    </FormItem>
                </Animated.View>

                <CategoryAiFields titleEn={titleEn} titleTags={titleTags} isRegenerating={isRegenerating} onRegenerate={handleRegenerate} />
            </View>

            <View className="px-3xl pb-3xl gap-y-md pt-xl">
                {mergeButton}

                <View className="flex-row gap-x-md">
                    <Button className="flex-1" variant="ghost" onPress={onCancel} content={<Trans>Cancel</Trans>} />
                    <Button
                        className="flex-1"
                        variant="cta"
                        onPress={handleFormSubmit}
                        disabled={isSaveDisabled}
                        content={<Trans>Save</Trans>}
                    />
                </View>
            </View>
        </ModalPage>
    );
    /* jscpd:ignore-end */
};
