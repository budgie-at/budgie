import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { OnEventFn } from '@rnw-community/shared';

import { AccountCardSelectors } from '../../../@e2e/selectors/account-card.selector';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
    readonly circleVariant?: ColorPaletteVariant;
    readonly deadlinePriority?: 'high' | 'normal';
    readonly topRight?: ReactNode;
    readonly balanceContent?: ReactNode;
    readonly children?: ReactNode;
    readonly onLongPress?: OnEventFn;
}

const cardVariants = cva('relative gap-3 active:scale-xs overflow-hidden', {
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
        className,
        instrumentSymbol,
        circleVariant = 'ghost',
        deadlinePriority = 'normal',
        topRight,
        balanceContent,
        children,
        onLongPress
    } = props;

    const showCents = useSetting('showCents');
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(showCents ? 0 : decimalPlaces);
    const { balance } = useAccountBalanceQuery(id);

    const navigateToAccount = () => void router.push(`/account/${id}/details`);
    const navigateToEditAccount = () => void router.push(`/account/${id}/update`);

    const accountBalance = formatDigits(balance, instrumentSymbol);

    return (
        <Card
            testID={AccountCardSelectors.Card(title)}
            onPress={navigateToAccount}
            onLongPress={onLongPress}
            className={cn(cardVariants({ deadlinePriority }), className)}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-lg">
                    <CircleIcon size={36} iconSize={20} icon={icon} variant={circleVariant} border={false} />
                    {topRight}
                </View>

                <HapticPressable className="rounded-full active:bg-secondary-background" onPress={navigateToEditAccount}>
                    <Icon className="text-primary" icon={UserIconNameEnum.EllipsisVertical} size={14} />
                </HapticPressable>
            </View>

            <View className="gap-1">
                <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                    {title}
                </Text>

                {balanceContent ?? <ProtectedText className="text-primary font-medium">{accountBalance}</ProtectedText>}
            </View>

            {children}
        </Card>
    );
};
