import { CategoryCreateEntitySchema, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { prettifyError } from 'zod';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { BottomSheetHeader } from '../../../@generic/components/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetView } from '../../../@generic/components/bottom-sheet-view/bottom-sheet-view';
import { FormItem } from '../../../@generic/components/form-item/form-item';
import { Icon } from '../../../@generic/components/icon/icon';
import { IconSelector } from '../../../@generic/components/icon-selector/icon-selector';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { CategoryBottomSheetFooter } from '../category-bottom-sheet-footer/category-bottom-sheet-footer';
import { CategoryPreview } from '../category-preview/category-preview';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly category: CategoryEntityInterface | null;
}

export const CreateCategoryBottomSheet = ({ ref, category }: Props) => {
    const { t } = useLingui();
    const [icon, setIcon] = useState(category?.icon ?? UserIconNameEnum.Home);
    const [title, setTitle] = useState(category?.title ?? '');

    const handleCancel = () => void ref.current?.close();

    const handleSubmit = async () => {
        const parsed = CategoryCreateEntitySchema.safeParse({
            title,
            icon: 'Home'
        });

        if (parsed.success) {
            await categoryRepository.create(parsed.data);

            setTitle('');

            ref.current?.close();
        } else {
            Toast.show({
                type: 'error',
                text1: t`Could not create category`,
                text2: prettifyError(parsed.error)
            });
        }
    };

    const handleDismiss = () => void setTitle('');

    return (
        <BottomSheet onDismiss={handleDismiss} ref={ref}>
            <BottomSheetView>
                <View className="bg-secondary-background p-xl rounded-3xl mx-auto mb-3xl border border-secondary-corner">
                    <Icon icon={ICONS.FolderOpen} className="text-primary" size={28} />
                </View>

                <View className="mb-10">
                    <BottomSheetHeader
                        size="lg"
                        align="center"
                        title={t`Create Category`}
                        description={t`Add a new category to organize your transactions`}
                    />
                </View>

                <View className="gap-y-3xl">
                    <FormItem label={t`Category Name`}>
                        <BottomSheetTextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder={t`Search categories...`}
                            className="text-md text-primary placeholder:text-secondary-foreground h-[56px] px-5xl bg-secondary-background rounded-5xl border border-secondary-corner"
                        />
                    </FormItem>

                    <FormItem label={t`Icon`}>
                        <IconSelector size="md" icon={icon} onSelect={setIcon} />
                    </FormItem>

                    <CategoryPreview icon={icon} title={title} />

                    <CategoryBottomSheetFooter onCancel={handleCancel} onSubmit={handleSubmit} />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
