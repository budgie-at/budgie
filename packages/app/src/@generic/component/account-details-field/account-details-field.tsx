import { ACCOUNT_TITLE_MAX_LENGTH, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { AccountFormBindingsInterface } from '../../../account/interface/account-form-bindings.interface';
import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { useIconSelectorModal } from '../../context/icon-selector-modal.context';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';
import { Input } from '../input/input';

interface Props {
    readonly titleBinding: AccountFormBindingsInterface['title'];
    readonly iconBinding: AccountFormBindingsInterface['icon'];
    readonly variant: ColorPaletteVariant;
    readonly placeholder: string;
    readonly nameInputTestID?: string;
    readonly selectNameOnFocus?: boolean;
}

export const AccountDetailsField = (props: Props) => {
    const { titleBinding, iconBinding, variant, placeholder, nameInputTestID, selectNameOnFocus = false } = props;
    const { t } = useLingui();
    const [openIconSelector] = useIconSelectorModal();
    const errorMessage = titleBinding.fieldState.error?.message;

    const handleIconPress = () => {
        openIconSelector({ selectedIcon: iconBinding.field.value, variant }, selectedIcon => {
            if (selectedIcon) {
                iconBinding.field.onChange(selectedIcon);
            }
        });
    };

    return (
        <View className="px-3xl py-lg">
            <View className="flex-row items-center gap-x-xl">
                <HapticPressable
                    onPress={handleIconPress}
                    accessibilityRole="button"
                    accessibilityLabel={t`Change icon`}
                    className="active:opacity-70"
                >
                    <CircleIcon
                        variant={variant}
                        size={36}
                        iconSize={18}
                        radius={18}
                        border={false}
                        icon={iconBinding.field.value}
                        className={TONAL_DISC_BACKGROUND[variant]}
                    />
                    <View className="absolute -right-[3px] -bottom-[3px] h-[20px] w-[20px] items-center justify-center rounded-full border-2 border-grouped-surface-row bg-surface-disc">
                        <Icon icon={UserIconNameEnum.Pencil} size={11} className="text-primary" />
                    </View>
                </HapticPressable>
                <View className="flex-1">
                    <Text className="text-secondary-foreground text-[13px]">{t`Account name`}</Text>
                    <Input
                        borderless
                        value={titleBinding.field.value}
                        onChangeText={titleBinding.field.onChange}
                        onBlur={titleBinding.field.onBlur}
                        selectTextOnFocus={selectNameOnFocus}
                        className="h-[28px] px-0 text-(length:--text-lg)"
                        maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                        placeholder={placeholder}
                        accessibilityLabel={t`Account name`}
                        returnKeyType="done"
                        testID={nameInputTestID}
                    />
                </View>
            </View>
            {isNotEmptyString(errorMessage) ? (
                <Text className="text-destructive-foreground pl-[48px] text-[13px]">{errorMessage}</Text>
            ) : null}
        </View>
    );
};
