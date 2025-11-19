import { CategoryCreateEntityInterface } from '@budgie/contracts';
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
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useCategoryForm } from '../../hooks/use-category-form.hook';
import { CategoryBottomSheetFooter } from '../category-bottom-sheet-footer/category-bottom-sheet-footer';
import { CategoryFormIconField } from '../category-form-icon-field/category-form-icon-field';
import { CategoryFormTitleField } from '../category-form-title-field/category-form-title-field';
import { CategoryPreview } from '../category-preview/category-preview';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly category: CategoryCreateEntityInterface | null;
}

export const CategoryFormBottomSheet = ({ ref, category }: Props) => {
    const { t } = useLingui();

    const { control, handleSubmit, reset, icon, title } = useCategoryForm(category);

    const handleCancel = () => void ref.current?.close();

    const createCategory = async (values: CategoryCreateEntityInterface) => {
        try {
            await categoryRepository.create(values);
            reset();
            ref.current?.close();
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not create category`,
                text2: t`Please try again later`
            });
        }
    };

    const renderFooter = (props: ComponentProps<typeof BottomSheetFooter>) => (
        <BottomSheetFooter {...props}>
            <CategoryBottomSheetFooter onCancel={handleCancel} onSubmit={handleSubmit(createCategory)} />
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
                            title={t`Create Category`}
                            description={t`Add a new category to organize your transactions`}
                        />
                    </View>

                    <View className="gap-y-3xl">
                        <CategoryFormTitleField control={control} />
                        <CategoryFormIconField control={control} />

                        <CategoryPreview icon={icon} title={title} />
                    </View>
                </View>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
