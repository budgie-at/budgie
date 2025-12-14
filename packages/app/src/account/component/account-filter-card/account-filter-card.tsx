import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';

interface Props {
    readonly selectedAccountIds: number[];
    readonly onSelect: (accountId: number) => void;
    readonly account: AccountWithInstrumentEntityInterface;
}

const accountVariants = cva('pl-[40px] flex-row items-center py-lg gap-x-xl pr-3xl', {
    variants: {
        isSelected: {
            true: 'bg-secondary-corner',
            false: 'bg-secondary-background'
        }
    }
});

export const AccountFilterCard = ({ selectedAccountIds, account, onSelect }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const format = useFormatMoney(decimalPlaces, account.instrument.code);

    const { balance } = useAccountBalanceQuery(account.id);

    const isSelected = selectedAccountIds.includes(account.id);

    const handleSelect = () => void onSelect(account.id);

    return (
        <HapticPressable onPress={handleSelect} className={accountVariants({ isSelected })}>
            <CircleIcon icon={ICONS[account.icon]} variant="ghost" />

            <Text className="text-sm font-medium text-secondary-foreground mr-auto">{account.title}</Text>

            <Text className="text-primary">{format(balance)}</Text>

            {isSelected ? <Icon icon={ICONS.Check} size={16} className="text-primary" /> : null}
        </HapticPressable>
    );
};
