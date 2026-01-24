/* jscpd:ignore-start */
import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormBottomSheet } from '../../../@generic/component/form-bottom-sheet/form-bottom-sheet';
import { FormBottomSheetTitleField } from '../../../@generic/component/form-bottom-sheet-title-field/form-bottom-sheet-title-field';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useTagsSelectorModal } from '../../context/tags-selector-modal.context';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { tagService } from '../../service/tag.service';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly tag: TagEntityInterface | null;
    readonly defaultTitle?: string;
    readonly onTagSaved?: (tag: TagEntityInterface) => void;
    readonly onTagMerged?: () => void;
}

export const TagFormBottomSheet = ({ ref, tag, defaultTitle, onTagSaved, onTagMerged }: Props) => {
    const { t } = useLingui();
    const { openTagsSelector } = useTagsSelectorModal();

    const { handleSubmit, reset, control } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));
    const isEditing = isDefined(tag?.id);

    const handleCancel = () => {
        void ref.current?.close();
        reset();
    };

    // eslint-disable-next-line react-hooks/refs
    const onSubmit = handleSubmit(async (values: TagCreateEntityInterface) => {
        try {
            const savedTag = isEditing ? await tagRepository.updateById(tag.id, values) : await tagRepository.create(values);
            reset();
            void ref.current?.close();
            onTagSaved?.(savedTag);
        } catch {
            Toast.show({
                type: 'error',
                text1: isEditing ? t`Could not update tag` : t`Could not create tag`,
                text2: t`Please try again later`
            });
        }
    });

    const handleOpenMerge = async () => {
        if (!isDefined(tag?.id)) {
            return;
        }

        const targetTagIds = await openTagsSelector({
            excludeTagIds: [tag.id],
            singleSelect: true
        });

        const targetTagId = isNotEmptyArray(targetTagIds) ? targetTagIds[0] : null;
        if (!isDefined(targetTagId)) {
            return;
        }

        try {
            await tagService.mergeInto(tag.id, targetTagId);
            void ref.current?.close();
            reset();
            onTagMerged?.();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not merge tag`,
                text2: t`Please try again later`
            });
        }
    };

    const submitLabel = isEditing ? t`Save` : t`Create`;

    return (
        <FormBottomSheet onDismiss={handleCancel} onCancel={handleCancel} onSubmit={onSubmit} submitLabel={submitLabel} ref={ref}>
            <FormBottomSheetTitleField
                placeholder={t`e.g., Business, Personal, Vacation`}
                maxLength={TAG_TITLE_MAX_LENGTH}
                label={t`Tag Name`}
                control={control}
            />

            {isEditing ? (
                <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={UserIconNameEnum.Merge}
                    onPress={handleOpenMerge}
                    content={<Trans>Merge into another tag</Trans>}
                />
            ) : null}
        </FormBottomSheet>
    );
};
/* jscpd:ignore-end */
