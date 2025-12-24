import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/components/protected-text/protected-text';
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

            <ProtectedText className="text-primary">{format(balance)}</ProtectedText>

            {isSelected ? <Icon icon={ICONS.Check} size={16} className="text-primary" /> : null}
        </HapticPressable>
    );
};
