import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

interface Props extends Pick<AccountEntityInterface, 'id' | 'icon' | 'type' | 'currentBalance' | 'title'> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

const cardVariants = cva(`rounded-3xl p-3xl border-2 border-secondary-corner items-center gap-x-xl flex-row`, {
    variants: {
        isSelected: {
            true: 'bg-secondary-background/30 border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

export const AccountSelectorCard = (props: Props) => {
    const { className, isSelected, title, onSelect, id, icon, type, currentBalance } = props;

    const { i18n } = useLingui();
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);

    const handleSelect = () => void onSelect(id);

    return (
        <HapticPressable disabled={isSelected} className={cn(cardVariants({ isSelected }), className)} onPress={handleSelect}>
            <CircleIcon size="2xl" className="rounded-5xl" icon={ICONS[icon]} variant="ghost" border={false} />

            <View className="gap-y-xxs flex-1">
                <Text className="text-md font-semibold text-primary">{title}</Text>

                <View className="flex-row items-center">
                    <Text className="text-secondary-foreground text-xs">{i18n.t(ACCOUNT_TYPE[type])}</Text>
                    <Text className="text-secondary-foreground text-xs">&nbsp;•&nbsp;</Text>
                    <Text className="text-sm font-medium text-primary">{formatMoney(currentBalance)}</Text>
                </View>
            </View>

            {isSelected ? (
                <View className="bg-primary rounded-full p-xs">
                    <Icon className="text-primary-reverse" icon={ICONS.Check} size={16} />
                </View>
            ) : null}
        </HapticPressable>
    );
};
