import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { TextInput, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormSheetHeader } from '../../../@generic/component/form-sheet-header/form-sheet-header';
import { FormSheetSpacer } from '../../../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useTagsSelectorModal } from '../../context/tags-selector-modal.context';
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

export const TagForm = (props: Props) => {
    const { tag, defaultTitle, onSuccess, onCancel } = props;
    const { t } = useLingui();
    const { backgroundColor } = useFormsheetListStyles();
    const { openTagsSelector } = useTagsSelectorModal();
    const { handleSubmit, reset, register } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));

    const isEditing = isDefined(tag?.id);
    const containerStyle = { flex: 1, backgroundColor };
    const title = isEditing ? <Trans>Edit Tag</Trans> : <Trans>Create Tag</Trans>;
    const submitButtonContent = isEditing ? <Trans>Save</Trans> : <Trans>Create</Trans>;

    const handleFormSubmit = handleSubmit(async (values: TagCreateEntityInterface) => {
        try {
            const savedTag = isEditing ? await tagRepository.updateById(tag.id, values) : await tagRepository.create(values);
            reset();
            onSuccess({ tag: savedTag, action: isEditing ? 'updated' : 'created' });
        } catch {
            showErrorToast(isEditing ? t`Could not update tag` : t`Could not create tag`, t`Please try again later`);
        }
    });

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
            reset();
            if (isDefined(targetTag)) {
                onSuccess({ tag: targetTag, action: 'merged' });
            }
            /* jscpd:ignore-start - Form merge pattern */
        } catch {
            showErrorToast(t`Could not merge tag`, t`Please try again later`);
        }
    };

    const handleCancelPress = () => {
        reset();
        onCancel();
    };

    return (
        <View style={containerStyle}>
            <FormSheetHeader>{title}</FormSheetHeader>
            <View className="px-3xl gap-y-2xl">
                <FormItem label={t`Tag Name`}>
                    <TextInput
                        className="h-[48px] px-lg bg-secondary-background rounded-xl border border-secondary-corner text-primary"
                        placeholder={t`e.g., Business, Personal, Vacation`}
                        maxLength={TAG_TITLE_MAX_LENGTH}
                        autoCapitalize="words"
                        autoCorrect={false}
                        {...register('title')}
                    />
                </FormItem>
                {isEditing ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={UserIconNameEnum.Merge}
                        onPress={handleMerge}
                        content={<Trans>Merge into another tag</Trans>}
                    />
                ) : null}
                <View className="flex-row gap-x-md pt-md">
                    <Button className="flex-1" variant="ghost" onPress={handleCancelPress} content={<Trans>Cancel</Trans>} />
                    <Button className="flex-1" variant="cta" onPress={handleFormSubmit} content={submitButtonContent} />
                </View>
            </View>
            <FormSheetSpacer />
        </View>
    );
    /* jscpd:ignore-end */
};
