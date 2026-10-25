import { ACCOUNT_TITLE_MAX_LENGTH } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { AccountFormBindingsInterface } from '../../../account/interface/account-form-bindings.interface';
import { useIconSelectorModal } from '../../context/icon-selector-modal.context';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { FormItem } from '../form-item/form-item';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Input } from '../input/input';

interface Props {
    readonly titleBinding: AccountFormBindingsInterface['title'];
    readonly iconBinding: AccountFormBindingsInterface['icon'];
    readonly variant: ColorPaletteVariant;
    readonly nameInputTestID?: string;
    readonly selectNameOnFocus?: boolean;
}

export const AccountDetailsField = (props: Props) => {
    const { titleBinding, iconBinding, variant, nameInputTestID, selectNameOnFocus = false } = props;
    const { t } = useLingui();
    const [openIconSelector] = useIconSelectorModal();
    const status = titleBinding.fieldState.invalid ? 'error' : 'default';

    const handleIconPress = () => {
        openIconSelector({ selectedIcon: iconBinding.field.value, variant }, selectedIcon => {
            if (selectedIcon) {
                iconBinding.field.onChange(selectedIcon);
            }
        });
    };

    return (
        <FormItem label={t`Account Name & Icon`} error={titleBinding.fieldState.error?.message}>
            <View className="flex-row gap-x-xl items-center">
                <HapticPressable onPress={handleIconPress}>
                    <CircleIcon variant={variant} size={62} iconSize={28} icon={iconBinding.field.value} />
                </HapticPressable>
                <Input
                    size="lg"
                    status={status}
                    value={titleBinding.field.value}
                    onChangeText={titleBinding.field.onChange}
                    onBlur={titleBinding.field.onBlur}
                    selectTextOnFocus={selectNameOnFocus}
                    className="flex-1"
                    maxLength={ACCOUNT_TITLE_MAX_LENGTH}
                    placeholder={t`e.g. Savings Account`}
                    testID={nameInputTestID}
                />
            </View>
        </FormItem>
    );
};
