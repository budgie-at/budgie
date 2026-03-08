import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { TransactionFiltersSelectors } from '../../../@e2e/selectors/transaction-filters.selector';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
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
    const formatDigits = useFormatDigits(decimalPlaces);

    const { balance } = useAccountBalanceQuery(account.id);

    const isSelected = selectedAccountIds.includes(account.id);

    const handleSelect = () => void onSelect(account.id);

    return (
        <HapticPressable
            onPress={handleSelect}
            className={accountVariants({ isSelected })}
            testID={TransactionFiltersSelectors.AccountOption(account.title)}
        >
            <CircleIcon icon={account.icon} variant="ghost" />

            <Text className="text-sm font-medium text-secondary-foreground mr-auto">{account.title}</Text>

            <ProtectedText className="text-primary">{formatDigits(balance, account.instrument.symbol)}</ProtectedText>

            {isSelected ? (
                <Icon
                    icon={UserIconNameEnum.Check}
                    size={16}
                    className="text-primary"
                    testID={TransactionFiltersSelectors.AccountOptionSelected(account.title)}
                />
            ) : null}
        </HapticPressable>
    );
};
