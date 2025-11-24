import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { SelectorCard } from '../../../@generic/components/selector-card/selector-card';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

interface Props extends Pick<AccountEntityInterface, 'id' | 'icon' | 'type' | 'currentBalance' | 'title'> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

export const AccountSelectorCard = (props: Props) => {
    const { className, isSelected, title, onSelect, id, icon, type, currentBalance } = props;

    const { i18n } = useLingui();
    const { defaultCurrency, decimalPlaces } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency);

    return (
        <SelectorCard
            identifier={id}
            isSelected={isSelected}
            onSelect={onSelect}
            className={className}
            iconSlot={<CircleIcon size="2xl" className="rounded-5xl" icon={ICONS[icon]} variant="ghost" border={false} />}
            title={title}
            subtitle={
                <View className="flex-row items-center">
                    <Text className="text-secondary-foreground text-xs">{i18n.t(ACCOUNT_TYPE[type])}</Text>
                    <Text className="text-secondary-foreground text-xs">&nbsp;•&nbsp;</Text>
                    <Text className="text-sm font-medium text-primary">{formatMoney(currentBalance)}</Text>
                </View>
            }
        />
    );
};
