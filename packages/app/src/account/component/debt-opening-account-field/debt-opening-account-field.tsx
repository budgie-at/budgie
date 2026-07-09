import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { type GestureResponderEvent, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useAccountSelectorModal } from '../../context/account-selector-modal.context';
import { useAccountSelector } from '../../hooks/use-account-selector.hook';
import { AccountInactiveIcon } from '../account-inactive-icon/account-inactive-icon';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly accountId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (accountId: number | null) => void;
}

export const DebtOpeningAccountField = ({ accountId, variant, onChange }: Props) => {
    const { t } = useLingui();
    const [openAccountSelector] = useAccountSelectorModal();
    const { icon, selectedAccount, formattedBalance } = useAccountSelector({
        accountId,
        excludeAccountTypes: [AccountTypeEnum.DEBT]
    });

    const handlePress = async () => {
        const selectedAccountId = await openAccountSelector({
            initialAccountId: accountId,
            excludeAccountTypes: [AccountTypeEnum.DEBT],
            onlyActive: false
        });

        if (isDefined(selectedAccountId)) {
            onChange(selectedAccountId);
        }
    };

    const handleClearPress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        onChange(null);
    };

    const label = t`From account`;
    const selectedAccountTitle = selectedAccount?.title ?? t`Select account`;
    const isInactiveAccount = isDefined(selectedAccount) && !selectedAccount.isActive;

    return (
        <HapticPressable
            className="flex-row items-center px-lg py-md gap-md bg-secondary-background rounded-2xl"
            onPress={handlePress}
            accessibilityLabel={`${label}: ${selectedAccountTitle}`}
            accessibilityRole="button"
            testID={CreateAccountScreenSelector.OpeningAccountSelector}
        >
            <AccountInactiveIcon isInactive={isInactiveAccount} size={36}>
                <CircleIcon icon={icon} variant={variant} size={36} iconSize={18} radius={12} />
            </AccountInactiveIcon>

            <View className="flex-1">
                <Text className="text-xs text-secondary-foreground uppercase">{label}</Text>
                <Text
                    className="text-md font-medium text-primary"
                    numberOfLines={1}
                    {...(isDefined(selectedAccount) && {
                        testID: CreateAccountScreenSelector.SelectedOpeningAccount(selectedAccount.title)
                    })}
                >
                    {selectedAccountTitle}
                </Text>
                {isDefined(selectedAccount) && (
                    <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                        {formattedBalance}
                    </Text>
                )}
            </View>

            {isDefined(selectedAccount) ? (
                <HapticPressable
                    onPress={handleClearPress}
                    accessibilityLabel={t`Remove`}
                    accessibilityRole="button"
                    testID={CreateAccountScreenSelector.ClearOpeningAccount}
                >
                    <CircleIcon icon={UserIconNameEnum.X} variant="ghost" size={28} iconSize={14} />
                </HapticPressable>
            ) : (
                <Icon icon={UserIconNameEnum.ChevronDown} size={16} className="text-secondary-foreground" />
            )}
        </HapticPressable>
    );
};
