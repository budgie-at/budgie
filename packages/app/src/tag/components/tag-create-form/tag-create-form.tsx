import { TAG_TITLE_MAX_LENGTH, TagCreateEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { UseFormRegister, UseFormReset } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { Button } from '../../../@generic/component/button/button';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { useThemeContext } from '../../../theme/context/theme.context';

const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

interface Props {
    readonly register: UseFormRegister<TagCreateEntityInterface>;
    readonly reset: UseFormReset<TagCreateEntityInterface>;
    readonly onCancel: () => void;
    readonly onSuccess: (tagId: number) => void;
    readonly handleSubmit: (onValid: (data: TagCreateEntityInterface) => Promise<void>) => (e?: React.BaseSyntheticEvent) => Promise<void>;
}

/* jscpd:ignore-start */
export const TagCreateForm = (props: Props) => {
    const { register, reset, onCancel, onSuccess, handleSubmit } = props;
    const { t } = useLingui();
    const { isDarkColorSchema } = useThemeContext();

    const spacerStyle = { height: 500, backgroundColor: isDarkColorSchema ? BG_DARK : BG_LIGHT };

    const handleCreateSubmit = handleSubmit(async (values: TagCreateEntityInterface) => {
        try {
            const createdTag = await tagRepository.create(values);
            reset();
            onSuccess(createdTag.id);
        } catch {
            Toast.show({
                type: 'error',
                text1: t`Could not create tag`,
                text2: t`Please try again later`
            });
        }
    });

    return (
        <>
            <View className="pt-4xl pb-3xl px-xl">
                <Text className="text-primary text-xl font-semibold text-center">
                    <Trans>Create Tag</Trans>
                </Text>
            </View>
            <View className="px-md gap-y-xl">
                <FormItem label={t`Tag Name`}>
                    <TextInput
                        className="h-[48px] px-lg bg-secondary-background rounded-xl border border-secondary-corner text-primary"
                        placeholder={t`e.g., Business, Personal, Vacation`}
                        maxLength={TAG_TITLE_MAX_LENGTH}
                        autoCapitalize="words"
                        autoCorrect={false}
                        {...register('title')}
                    />
                </FormItem>

                <View className="flex-row gap-x-md">
                    <Button className="flex-1" variant="ghost" onPress={onCancel} content={<Trans>Cancel</Trans>} />
                    <Button className="flex-1" variant="primary" onPress={handleCreateSubmit} content={<Trans>Create</Trans>} />
                </View>
            </View>
            <View style={spacerStyle} />
        </>
    );
};
/* jscpd:ignore-end */
