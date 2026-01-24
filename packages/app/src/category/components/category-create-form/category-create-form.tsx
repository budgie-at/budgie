import { CATEGORY_TITLE_MAX_LENGTH, CategoryCreateEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Control, UseFormRegister, UseFormReset } from 'react-hook-form';
import { TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Button } from '../../../@generic/component/button/button';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { CategoryFormIconField } from '../category-form-icon-field/category-form-icon-field';

interface Props {
    readonly control: Control<CategoryCreateEntityInterface>;
    readonly register: UseFormRegister<CategoryCreateEntityInterface>;
    readonly reset: UseFormReset<CategoryCreateEntityInterface>;
    readonly onCancel: () => void;
    readonly onSuccess: (categoryId: number) => void;
    readonly handleSubmit: (
        onValid: (data: CategoryCreateEntityInterface) => Promise<void>
    ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

const HEADER_HEIGHT = { paddingTop: 88 };

export const CategoryCreateForm = (props: Props) => {
    const { control, register, reset, onCancel, onSuccess, handleSubmit } = props;
    const { t } = useLingui();

    const handleCreateSubmit = handleSubmit(async (values: CategoryCreateEntityInterface) => {
        try {
            const createdCategory = await categoryRepository.create(values);
            reset();
            onSuccess(createdCategory.id);
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not create category`,
                text2: t`Please try again later`
            });
        }
    });

    return (
        <View className="flex-1 px-xl" style={HEADER_HEIGHT}>
            <FormItem label={t`Category Name`}>
                <TextInput
                    className="h-[48px] px-lg bg-secondary-background rounded-xl border border-secondary-corner text-primary"
                    placeholder={t`e.g., Groceries, Salary, Rent`}
                    maxLength={CATEGORY_TITLE_MAX_LENGTH}
                    autoCapitalize="words"
                    autoCorrect={false}
                    {...register('title')}
                />
            </FormItem>

            <CategoryFormIconField control={control} />

            <View className="flex-row gap-x-md mt-xl">
                <Button className="flex-1" variant="ghost" onPress={onCancel} content={<Trans>Cancel</Trans>} />
                <Button className="flex-1" variant="primary" onPress={handleCreateSubmit} content={<Trans>Create</Trans>} />
            </View>
        </View>
    );
};
