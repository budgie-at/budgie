import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { OnEventFn, isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import { AccountCardBaseSelector } from './account-card-base.selector';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly balance: number;
    readonly className?: string;
    readonly instrumentSymbol: string;
    readonly accessibilityLabel?: string;
    readonly circleVariant?: ColorPaletteVariant;
    readonly topRight?: ReactNode;
    readonly bottomRight?: ReactNode;
    readonly balanceContent?: ReactNode;
    readonly children?: ReactNode;
    readonly onLongPress?: OnEventFn;
}

export const AccountCardBase = (props: Props) => {
    const {
        id,
        title,
        icon,
        balance,
        className,
        instrumentSymbol,
        accessibilityLabel,
        circleVariant = 'ghost',
        topRight,
        bottomRight,
        balanceContent,
        children,
        onLongPress
    } = props;

    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const protectAmount = useProtectedAmountLabel();

    const navigateToAccount = () => void router.push({ pathname: '/account/[id]/details', params: { id: String(id) } });
    const navigateToEditAccount = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(id) } });

    const accountCardTestID = AccountCardBaseSelector.Card(title);
    const accountBalance = formatDigits(balance, instrumentSymbol);
    const accountBalanceTestValue = formatDigits(balance);

    return (
        <Card
            accessible
            testID={accountCardTestID}
            accessibilityLabel={accessibilityLabel ?? `${title}, ${protectAmount(balance, instrumentSymbol)}`}
            onPress={navigateToAccount}
            onLongPress={onLongPress}
            className={cn('relative flex-none gap-3 active:scale-xs overflow-hidden border-secondary-corner', className)}
        >
            <View className="gap-3">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-x-lg">
                        <CircleIcon size={36} iconSize={20} icon={icon} variant={circleVariant} border={false} />
                        {topRight}
                    </View>

                    <HapticPressable
                        className="rounded-full active:bg-secondary-background"
                        onPress={navigateToEditAccount}
                        accessibilityRole="button"
                        accessibilityLabel={t`Edit account`}
                    >
                        <Icon className="text-primary" icon={UserIconNameEnum.EllipsisVertical} size={14} />
                    </HapticPressable>
                </View>

                <View className="flex-row items-end justify-between gap-2">
                    <View className="min-w-0 flex-1 gap-1">
                        <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                            {title}
                        </Text>

                        {balanceContent ?? (
                            <ProtectedText
                                className="text-primary font-medium"
                                testID={AccountCardBaseSelector.Balance(title, accountBalanceTestValue)}
                            >
                                {accountBalance}
                            </ProtectedText>
                        )}
                    </View>

                    {isDefined(bottomRight) && <View className="w-[14px] items-center">{bottomRight}</View>}
                </View>

                {children}
            </View>
        </Card>
    );
};
