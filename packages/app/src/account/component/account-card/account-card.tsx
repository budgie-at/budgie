import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/components/protected-text/protected-text';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { DebtAccountCard } from './debt-account-card';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon' | 'type' | 'returnAt' | 'debtType' | 'amountToReturn'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

export const AccountCard = ({ icon, title, returnAt, type, amountToReturn, className, id, debtType, instrumentSymbol }: Props) => {
    const showCents = useSetting('showCents');
    const { decimalPlaces } = useSettingsContext();
    const { balance } = useAccountBalanceQuery(id);

    const format = useFormatDigits(showCents ? 0 : decimalPlaces);

    const navigateToAccount = () => void router.push(`/account/${id}/details`);
    const navigateToEditAccount = () => void router.push(`/account/${id}/update`);

    const formattedBalance = format(convertFromMicroUnits(balance).toString());

    if (type === AccountTypeEnum.DEBT) {
        return (
            <DebtAccountCard
                amountToReturn={amountToReturn}
                id={id}
                returnAt={returnAt}
                title={title}
                instrumentSymbol={instrumentSymbol}
                debtType={debtType}
                className={className}
            />
        );
    }

    return (
        <Card onPress={navigateToAccount} className={cn('gap-3 active:scale-xs', className)}>
            <View className="flex-row justify-between">
                <CircleIcon border={false} icon={ICONS[icon]} variant="ghost" />

                <HapticPressable className="rounded-full p-xs active:bg-secondary-background" onPress={navigateToEditAccount}>
                    <Icon className="text-primary" icon={ICONS.EllipsisVertical} size={14} />
                </HapticPressable>
            </View>

            <View className="gap-1">
                <Text className="text-secondary-foreground" ellipsizeMode="tail" numberOfLines={1}>
                    {title}
                </Text>

                <ProtectedText className="text-primary font-semibold" placeholderText={`${instrumentSymbol}999.99`}>
                    {instrumentSymbol}
                    {formattedBalance}
                </ProtectedText>
            </View>
        </Card>
    );
};
