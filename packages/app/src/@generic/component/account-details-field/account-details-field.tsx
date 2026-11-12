import { ACCOUNT_TITLE_MAX_LENGTH, isEmojiIcon } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { AccountFormBindingsInterface } from '../../../account/interface/account-form-bindings.interface';
import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { useIconSearchEntries } from '../../hook/use-icon-search-entries.hook';
import { useOpenModal } from '../../hook/use-open-modal/use-open-modal.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { IconTitleField } from '../icon-title-field/icon-title-field';
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
    const openIconSelector = useOpenModal('/icon-selector');
    const iconName = useIconSearchEntries().find(entry => entry.icon === iconBinding.field.value)?.label ?? iconBinding.field.value;
    const iconSize = isEmojiIcon(iconBinding.field.value) ? 22 : 20;

    const handleIconPress = () => {
        openIconSelector({ selectedIcon: iconBinding.field.value }, selectedIcon => {
            if (selectedIcon) {
                iconBinding.field.onChange(selectedIcon);
            }
        });
    };

    return (
        <IconTitleField
            tile={
                <HapticPressable
                    onPress={handleIconPress}
                    accessibilityRole="button"
                    accessibilityLabel={t`Change icon`}
                    accessibilityHint={t`Current icon: ${iconName}. Opens the icon picker.`}
                    hitSlop={4}
                    className="size-[40px] items-center justify-center active:opacity-70"
                >
                    <View>
                        <CircleIcon
                            variant={variant}
                            size={40}
                            iconSize={iconSize}
                            radius={10}
                            border={false}
                            icon={iconBinding.field.value}
                            className={TONAL_DISC_BACKGROUND[variant]}
                        />
                    </View>
                </HapticPressable>
            }
            label={t`Account name`}
            error={titleBinding.fieldState.error?.message}
            testID={nameInputTestID}
        >
            <Input
                borderless
                value={titleBinding.field.value}
                onChangeText={titleBinding.field.onChange}
                onBlur={titleBinding.field.onBlur}
                selectTextOnFocus={selectNameOnFocus}
                className="h-auto min-h-[28px] px-0 text-(length:--text-lg)"
                maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                placeholder={placeholder}
                accessibilityLabel={t`Account name`}
                returnKeyType="done"
                testID={nameInputTestID}
            />
        </IconTitleField>
    );
};
