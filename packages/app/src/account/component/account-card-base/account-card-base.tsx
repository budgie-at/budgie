import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnEventFn } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';

import { AccountCardBaseSelector } from './account-card-base.selector';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly balance: number;
    readonly className?: string;
    readonly instrumentSymbol: string;
    readonly circleVariant?: ColorPaletteVariant;
    readonly deadlinePriority?: 'high' | 'normal';
    readonly topRight?: ReactNode;
    readonly balanceContent?: ReactNode;
    readonly children?: ReactNode;
    readonly onLongPress?: OnEventFn;
}

const cardVariants = cva('relative flex-none gap-3 active:scale-xs overflow-hidden', {
    variants: {
        deadlinePriority: {
            high: 'border-dark-warning-corner',
            normal: 'border-secondary-corner'
        }
    },
    defaultVariants: {
        deadlinePriority: 'normal'
    }
});

export const AccountCardBase = (props: Props) => {
    const {
        id,
        title,
        icon,
        balance,
        className,
        instrumentSymbol,
        circleVariant = 'ghost',
        deadlinePriority = 'normal',
        topRight,
        balanceContent,
        children,
        onLongPress
    } = props;

    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();

    const navigateToAccount = () => void router.push(`/account/${id}/details`);
    const navigateToEditAccount = () => void router.push(`/account/${id}/update`);

    const cardTestID = AccountCardBaseSelector.Card(title);
    const accountBalance = formatDigits(balance, instrumentSymbol);
    const accountBalanceTestValue = formatDigits(balance);

    return (
        <Card
            accessible
            accessibilityLabel={`${title}, ${accountBalance}`}
            nativeID={cardTestID}
            testID={cardTestID}
            onPress={navigateToAccount}
            onLongPress={onLongPress}
            className={cn(cardVariants({ deadlinePriority }), className)}
        >
            <View collapsable={false} nativeID={cardTestID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={cardTestID} />
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

                <View className="gap-1">
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

                {children}
            </View>
        </Card>
    );
};
