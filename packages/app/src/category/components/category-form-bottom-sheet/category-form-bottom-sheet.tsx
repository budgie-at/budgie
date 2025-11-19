import { CATEGORY_TITLE_MAX_LENGTH, CategoryCreateEntityInterface, CategoryCreateEntitySchema } from '@budgie/contracts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

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
import { useCategoryForm } from '../../hooks/use-category-form.hook';

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

    return (
        <BottomSheet onDismiss={reset} ref={ref}>
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
                    <Controller
                        name="title"
                        control={control}
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <FormItem label={t`Category Name`} error={error?.message}>
                                <BottomSheetTextInput
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder={t`Category name`}
                                    maxLength={CATEGORY_TITLE_MAX_LENGTH}
                                    className="text-md text-primary placeholder:text-secondary-foreground h-[56px] px-5xl bg-secondary-background rounded-5xl border border-secondary-corner"
                                />
                            </FormItem>
                        )}
                    />

                    <Controller
                        name="icon"
                        control={control}
                        render={({ field: { value, onChange }, fieldState: { error } }) => (
                            <FormItem label={t`Icon`} error={error?.message}>
                                <IconSelector size="md" icon={value} onSelect={onChange} />
                            </FormItem>
                        )}
                    />

                    <CategoryPreview icon={icon} title={title} />

                    <CategoryBottomSheetFooter onCancel={handleCancel} onSubmit={handleSubmit(createCategory)} />
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
