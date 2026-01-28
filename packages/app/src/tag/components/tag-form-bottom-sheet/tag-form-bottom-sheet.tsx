/* jscpd:ignore-start */
import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject, useRef } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { FormBottomSheet } from '../../../@generic/component/form-bottom-sheet/form-bottom-sheet';
import { FormBottomSheetTitleField } from '../../../@generic/component/form-bottom-sheet-title-field/form-bottom-sheet-title-field';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { tagService } from '../../service/tag.service';
import { TagSelectorBottomSheet } from '../tag-selector-bottom-sheet/tag-selector-bottom-sheet';
import { TagFormSelectors } from '../../../@e2e/selectors/tag-form.selector';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly tag: TagEntityInterface | null;
    readonly defaultTitle?: string;
    readonly onTagSaved?: (tag: TagEntityInterface) => void;
    readonly onTagMerged?: () => void;
}

export const TagFormBottomSheet = ({ ref, tag, defaultTitle, onTagSaved, onTagMerged }: Props) => {
    const { t } = useLingui();

    const mergeSelectorRef = useRef<BottomSheetInterface | null>(null);

    const { handleSubmit, reset, control } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));
    const isEditing = isDefined(tag?.id);
    const excludeTagIds = isDefined(tag?.id) ? [tag.id] : [];

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

    const handleOpenMerge = () => {
        void mergeSelectorRef.current?.open();
    };

    const handleMergeSelect = async (targetTagId: number | null) => {
        if (!isDefined(tag?.id) || !isDefined(targetTagId)) {
            return;
        }

        try {
            await tagService.mergeInto(tag.id, targetTagId);
            void mergeSelectorRef.current?.close();
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
        <>
            <FormBottomSheet submitButtonTestID={TagFormSelectors.Submit} onDismiss={handleCancel} onCancel={handleCancel} onSubmit={onSubmit} submitLabel={submitLabel} ref={ref}>
                <FormBottomSheetTitleField
                    placeholder={t`e.g., Business, Personal, Vacation`}
                    maxLength={TAG_TITLE_MAX_LENGTH}
                    testID={TagFormSelectors.Input}
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

            {isEditing && isDefined(tag) ? (
                <TagSelectorBottomSheet
                    ref={mergeSelectorRef}
                    selectedTag={null}
                    excludeTagIds={excludeTagIds}
                    onSelect={handleMergeSelect}
                />
            ) : null}
        </>
    );
};
/* jscpd:ignore-end */
