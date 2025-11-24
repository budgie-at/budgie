import { ACCOUNT_TITLE_MAX_LENGTH, AccountCreateEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { View } from 'react-native';

import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { FormItem } from '../form-item/form-item';
import { IconSelector } from '../icon-selector/icon-selector';
import { Input } from '../input/input';

interface Props {
    readonly control: Control<AccountCreateEntityInterface>;
    readonly variant: ColorPaletteVariant;
}

export const CreateAccountDetailsField = ({ control, variant }: Props) => {
    const { t } = useLingui();

    const renderIconField = ({ field: iconField }: UseControllerReturn<AccountCreateEntityInterface, 'icon'>) => (
        <IconSelector size="sm" icon={iconField.value} variant={variant} onSelect={iconField.onChange} />
    );

    const renderTitleField = ({ field, fieldState }: UseControllerReturn<AccountCreateEntityInterface, 'title'>) => {
        const variant = fieldState.invalid ? 'destructive' : 'default';

        return (
            <FormItem label={t`Account Name & Icon`} error={fieldState.error?.message}>
                <View className="flex-row gap-x-xl">
                    <Controller control={control} name={'icon' as const} render={renderIconField} />

                    <Input
                        size="lg"
                        value={field.value}
                        variant={variant}
                        onChangeText={field.onChange}
                        className="text-ellipsis flex-1"
                        maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                        placeholder={t`e.g. Savings Account`}
                    />
                </View>
            </FormItem>
        );
    };

    return <Controller control={control} name={'title' as const} render={renderTitleField} />;
};
