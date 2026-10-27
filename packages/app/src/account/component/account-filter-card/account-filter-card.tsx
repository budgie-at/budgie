import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAnalyticsHistorySyncsQuery } from '../../../sync/query/use-analytics-history-syncs.query';
import { getHistoryImportStatusMessage } from '../../../sync/utils/get-history-import-status-message.util';
import { TransactionFiltersSelector } from '../../../transaction/components/transaction-filters/transaction-filters.selector';
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
    const { t } = useLingui();
    const { syncs } = useAnalyticsHistorySyncsQuery();
    const history = syncs.find(row => row.account.id === account.id);
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const { balance } = useAccountBalanceQuery(account.id);

    const historyStatus = isDefined(history) ? t(getHistoryImportStatusMessage(history.sync)) : null;
    const isSelected = selectedAccountIds.includes(account.id);

    const handleSelect = () => void onSelect(account.id);

    return (
        <HapticPressable
            onPress={handleSelect}
            className={accountVariants({ isSelected })}
            testID={TransactionFiltersSelector.AccountOption(account.title)}
        >
            <CircleIcon icon={account.icon} variant="ghost" />

            <View className="flex-1 gap-y-xxs">
                <Text className="text-sm font-medium text-secondary-foreground">{account.title}</Text>
                {isDefined(historyStatus) ? <Text className="text-xs text-secondary-foreground">{historyStatus}</Text> : null}
            </View>

            <ProtectedText className="text-primary">{formatDigits(balance, account.instrument.symbol)}</ProtectedText>

            {isSelected ? (
                <Icon
                    icon={UserIconNameEnum.Check}
                    size={16}
                    className="text-primary"
                    testID={TransactionFiltersSelector.AccountOptionSelected(account.title)}
                />
            ) : null}
        </HapticPressable>
    );
};
