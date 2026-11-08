import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { type GestureResponderEvent, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { AccountInactiveIcon } from '../account-inactive-icon/account-inactive-icon';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title' | 'icon' | 'isActive'> | null;
    readonly label: string;
    readonly variant: ColorPaletteVariant;
    readonly formattedBalance: string;
    readonly onPress: () => void;
    readonly onClear: (event: GestureResponderEvent) => void;
}

export const DebtOpeningAccountRow = ({ account, label, variant, formattedBalance, onPress, onClear }: Props) => {
    const { t } = useLingui();

    const icon = account?.icon ?? UserIconNameEnum.Wallet;
    const selectedAccountTitle = account?.title ?? t`Select account`;
    const isInactiveAccount = isDefined(account) && !account.isActive;

    return (
        <HapticPressable
            className="flex-row items-center px-lg py-md gap-md bg-secondary-background rounded-2xl"
            onPress={onPress}
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
                    {...(isDefined(account) && {
                        testID: CreateAccountScreenSelector.SelectedOpeningAccount(account.title)
                    })}
                >
                    {selectedAccountTitle}
                </Text>
                {isDefined(account) ? (
                    <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                        {formattedBalance}
                    </Text>
                ) : (
                    <Text
                        className="text-xs text-secondary-foreground"
                        numberOfLines={1}
                        testID={CreateAccountScreenSelector.ManualOpeningHint}
                    >
                        <Trans>Optional — without it the amount stays manual</Trans>
                    </Text>
                )}
            </View>

            {isDefined(account) ? (
                <HapticPressable
                    onPress={onClear}
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
