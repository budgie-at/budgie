import { ACCOUNT_TITLE_MAX_LENGTH } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { AccountFormBindingsInterface } from '../../../account/interface/account-form-bindings.interface';
import { useIconSelectorModal } from '../../context/icon-selector-modal.context';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
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
    const [openIconSelector] = useIconSelectorModal();

    const handleIconPress = () => {
        openIconSelector({ selectedIcon: iconBinding.field.value, variant }, selectedIcon => {
            if (selectedIcon) {
                iconBinding.field.onChange(selectedIcon);
            }
        });
    };

    return (
        <IconTitleField
            icon={iconBinding.field.value}
            variant={variant}
            label={t`Account name`}
            onIconPress={handleIconPress}
            error={titleBinding.fieldState.error?.message}
        >
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
        </IconTitleField>
    );
};
