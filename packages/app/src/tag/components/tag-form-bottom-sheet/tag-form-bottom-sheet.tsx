import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined } from '@rnw-community/shared';

import { FormBottomSheet } from '../../../@generic/component/form-bottom-sheet/form-bottom-sheet';
import { FormBottomSheetTitleField } from '../../../@generic/component/form-bottom-sheet-title-field/form-bottom-sheet-title-field';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useTagForm } from '../../hooks/use-tag-form.hook';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly tag: TagEntityInterface | null;
    readonly defaultTitle?: string;
    readonly onTagSaved?: (tag: TagEntityInterface) => void;
}

export const TagFormBottomSheet = ({ ref, tag, defaultTitle, onTagSaved }: Props) => {
    const { handleSubmit, reset, control } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));
    const { t } = useLingui();

    const isEditing = isDefined(tag?.id);

    const handleCancel = () => {
        void ref.current?.close();
        reset();
    };

    const saveTag = async (values: TagCreateEntityInterface) => {
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
    };

    const handleSave = () => void handleSubmit(saveTag)();

    const title = isEditing ? t`Edit Tag` : t`Create Tag`;
    const description = isEditing ? t`Update the tag name` : t`Add a new tag to organize your transactions`;

    return (
        <FormBottomSheet
            onDismiss={handleCancel}
            onCancel={handleCancel}
            onSubmit={handleSave}
            title={title}
            description={description}
            ref={ref}
        >
            <FormBottomSheetTitleField
                placeholder={t`e.g., Business, Personal, Vacation`}
                maxLength={TAG_TITLE_MAX_LENGTH}
                label={t`Tag Name`}
                control={control}
            />
        </FormBottomSheet>
    );
};
