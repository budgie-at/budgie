import { AccountAssociationEnum, AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { cn } from '../../../@generic/utils/cn.util';
import { AccountSelectorModalSelector } from '../../../app/account-selector-modal.selector';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { AccountInactiveIcon } from '../account-inactive-icon/account-inactive-icon';

interface Props extends Pick<
    AccountWithInstrumentEntityInterface,
    'id' | 'icon' | 'type' | 'title' | 'isActive' | AccountAssociationEnum.INSTRUMENT
> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

const cardVariants = cva('rounded-3xl p-3xl border-2 gap-x-xl flex-row items-center', {
    variants: {
        isSelected: {
            true: 'bg-secondary-background/30 border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

export const AccountSelectorCard = (props: Props) => {
    const { className, isSelected, title, onSelect, id, icon, type, instrument, isActive } = props;

    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const { balance } = useAccountBalanceQuery(id);
    const formatDigits = useFormatDigits(decimalPlaces);
    const optionTestID = AccountSelectorModalSelector.Option(title);
    const handleSelect = () => void onSelect(id);
    const cardClassName = cn(cardVariants({ isSelected }), className);
    const right = isSelected ? (
        <View className="bg-primary rounded-full p-xs">
            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Check} size={16} />
        </View>
    ) : null;

    return (
        <HapticPressable
            className={cardClassName}
            onPress={handleSelect}
            accessible
            accessibilityLabel={title}
            accessibilityRole="button"
            collapsable={false}
        >
            <View className="flex-row items-center gap-x-xl flex-1" testID={optionTestID} nativeID={optionTestID} collapsable={false}>
                <AccountInactiveIcon isInactive={!isActive} size={48}>
                    <CircleIcon size={48} iconSize={24} className="rounded-5xl" icon={icon} variant="ghost" border={false} />
                </AccountInactiveIcon>

                <View className="gap-y-xxs flex-1 justify-center">
                    <Text className="text-md font-semibold text-primary">{title}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-secondary-foreground text-xs flex-shrink" numberOfLines={1}>
                            {t(ACCOUNT_TYPE[type])}
                        </Text>
                        <Text className="text-secondary-foreground text-xs">&nbsp;•&nbsp;</Text>
                        <ProtectedText className="text-sm font-medium text-primary" numberOfLines={1}>
                            {formatDigits(balance, instrument.symbol)}
                        </ProtectedText>
                    </View>
                </View>

                {right}
            </View>
        </HapticPressable>
    );
};
