import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import Toast from 'react-native-toast-message';

import { FormBottomSheet } from '../../../@generic/component/form-bottom-sheet/form-bottom-sheet';
import { FormBottomSheetTitleField } from '../../../@generic/component/form-bottom-sheet-title-field/form-bottom-sheet-title-field';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { TagPreview } from '../tag-preview/tag-preview';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly tag: TagCreateEntityInterface | null;
    readonly defaultTitle?: string;
    readonly onTagCreated?: (tag: TagEntityInterface) => void;
}

export const TagFormBottomSheet = ({ ref, tag, defaultTitle, onTagCreated }: Props) => {
    const { handleSubmit, reset, control, title } = useTagForm(tag ?? (defaultTitle ? { title: defaultTitle } : null));
    const { t } = useLingui();

    const handleCancel = () => {
        void ref.current?.close();
        reset();
    };

    const createTag = async (values: TagCreateEntityInterface) => {
        try {
            const newTag = await tagRepository.create(values);
            reset();
            void ref.current?.close();
            onTagCreated?.(newTag);
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not create tag`,
                text2: t`Please try again later`
            });
        }
    };

    const onSubmit = () => void handleSubmit(createTag)();

    return (
        <FormBottomSheet
            onDismiss={handleCancel}
            onCancel={handleCancel}
            onSubmit={onSubmit}
            icon={UserIconNameEnum.Tag}
            title={t`Create Tag`}
            description={t`Add a new tag to organize your transactions`}
            ref={ref}
        >
            <FormBottomSheetTitleField
                placeholder={t`e.g., Business, Personal, Vacation`}
                maxLength={TAG_TITLE_MAX_LENGTH}
                label={t`Tag Name`}
                control={control}
            />

            <TagPreview title={title} />
        </FormBottomSheet>
    );
};
