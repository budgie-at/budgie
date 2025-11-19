import { TagCreateEntityInterface } from '@budgie/contracts';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useLingui } from '@lingui/react/macro';
import { ComponentProps, RefObject } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetFooter } from '../../../@generic/components/bottom-sheet-footer/bottom-sheet-footer';
import { BottomSheetHeader } from '../../../@generic/components/bottom-sheet-header/bottom-sheet-header';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useTagForm } from '../../hooks/use-tag-form.hook';
import { TagBottomSheetFooter } from '../tag-bottom-sheet-footer/tag-bottom-sheet-footer';
import { TagFormIconField } from '../tag-form-icon-field/tag-form-icon-field';
import { TagFormTitleField } from '../tag-form-title-field/tag-form-title-field';
import { TagPreview } from '../tag-preview/tag-preview';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly tag: TagCreateEntityInterface | null;
}

export const TagFormBottomSheet = ({ ref, tag }: Props) => {
    const { t } = useLingui();

    const { control, handleSubmit, reset, title } = useTagForm(tag);

    const handleCancel = () => void ref.current?.close();

    const createTag = async (values: TagCreateEntityInterface) => {
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
    };

    const renderFooter = (props: ComponentProps<typeof BottomSheetFooter>) => (
        <BottomSheetFooter {...props}>
            <TagBottomSheetFooter onCancel={handleCancel} onSubmit={handleSubmit(createTag)} />
        </BottomSheetFooter>
    );

    return (
        <BottomSheet footerComponent={renderFooter} onDismiss={reset} ref={ref}>
            <BottomSheetScrollView showsVerticalScrollIndicator={false}>
                <View className="px-5xl pb-[100px]">
                    <View className="bg-secondary-background p-xl rounded-3xl mx-auto mb-3xl border border-secondary-corner">
                        <Icon icon={ICONS.FolderOpen} className="text-primary" size={28} />
                    </View>

                    <View className="mb-10">
                        <BottomSheetHeader
                            size="lg"
                            align="center"
                            title={t`Create Tag`}
                            description={t`Add a new tag to organize your transactions`}
                        />
                    </View>

                    <View className="gap-y-3xl">
                        <TagFormTitleField control={control} />

                        <TagPreview title={title} />
                    </View>
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
