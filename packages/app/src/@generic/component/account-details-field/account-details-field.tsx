import { ACCOUNT_TITLE_MAX_LENGTH, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Control, Controller, FieldPath, UseControllerReturn } from 'react-hook-form';
import { View } from 'react-native';

import { useIconSelectorModal } from '../../context/icon-selector-modal.context';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { FormItem } from '../form-item/form-item';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Input } from '../input/input';

type AccountDetailsFieldsProps<T extends { title: string; icon: UserIconNameEnum }> = {
    readonly control: Control<T>;
    readonly variant: ColorPaletteVariant;
    readonly nameInputTestID?: string;
};

export const AccountDetailsField = <T extends { title: string; icon: UserIconNameEnum }>({
    control,
    variant,
    nameInputTestID
}: AccountDetailsFieldsProps<T>) => {
    const { t } = useLingui();
    const { openIconSelector } = useIconSelectorModal();

    const renderIconField = ({ field: { value, onChange } }: UseControllerReturn<T, FieldPath<T>>) => {
        const handlePress = async () => {
            const selectedIcon = await openIconSelector({ selectedIcon: value as UserIconNameEnum, variant });

            if (selectedIcon) {
                onChange(selectedIcon as Parameters<typeof onChange>[0]);
            }
        };

        return (
            <HapticPressable onPress={handlePress}>
                <CircleIcon variant={variant} size={62} iconSize={28} icon={value as UserIconNameEnum} />
            </HapticPressable>
        );
    };

    const renderTitleField = ({ field, fieldState }: UseControllerReturn<T, FieldPath<T>>) => {
        const status = fieldState.invalid ? 'error' : 'default';

        return (
            <FormItem label={t`Account Name & Icon`} error={fieldState.error?.message}>
                <View className="flex-row gap-x-xl items-center">
                    <Controller control={control} name={'icon' as FieldPath<T>} render={renderIconField} />

                    <Input
                        size="lg"
                        status={status}
                        value={field.value}
                        onChangeText={field.onChange}
                        className="text-ellipsis flex-1"
                        maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                        placeholder={t`e.g. Savings Account`}
                        testID={nameInputTestID}
                    />
                </View>
            </FormItem>
        );
    };

    return <Controller control={control} name={'title' as FieldPath<T>} render={renderTitleField} />;
};
