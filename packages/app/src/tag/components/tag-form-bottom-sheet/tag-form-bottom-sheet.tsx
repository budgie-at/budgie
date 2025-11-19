import { TagCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useCallback } from 'react';
import Toast from 'react-native-toast-message';

import { FormBottomSheet } from '../../../@generic/components/form-bottom-sheet/form-bottom-sheet';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { TagFormTitleField } from '../tag-form-title-field/tag-form-title-field';
import { TagPreview } from '../tag-preview/tag-preview';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly tag: TagCreateEntityInterface | null;
}

export const TagFormBottomSheet = ({ ref, tag }: Props) => {
    const { handleSubmit, reset, control, title } = useTagForm(tag);
    const { t } = useLingui();

    const handleCancel = () => {
        void ref.current?.close();
        reset();
    };

    const createTag = useCallback(
        async (values: TagCreateEntityInterface) => {
            try {
                await tagRepository.create(values);
                reset();
                ref.current?.close();
            } catch {
                Toast.show({
                    type: 'error',
                    text1: t`Could not create tag`,
                    text2: t`Please try again later`
                });
            }
        },
        [ref, reset, t]
    );

    const onSubmit = useCallback(() => {
        void handleSubmit(createTag)();
    }, [handleSubmit, createTag]);

    return (
        <FormBottomSheet
            onDismiss={handleCancel}
            onCancel={handleCancel}
            onSubmit={onSubmit}
            icon="Tag"
            title={t`Create Tag`}
            description={t`Add a new tag to organize your transactions`}
            ref={ref}
        >
            <TagFormTitleField control={control} />

            <TagPreview title={title} />
        </FormBottomSheet>
    );
};
