import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FilterSheetCheckbox } from '../../../@generic/component/filter-sheet/filter-sheet-checkbox/filter-sheet-checkbox';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useAnalyticsHistorySyncsQuery } from '../../../sync/query/use-analytics-history-syncs.query';
import { getHistoryImportStatusMessage } from '../../../sync/utils/get-history-import-status-message.util';
import { TransactionFiltersSelector } from '../../../transaction/components/transaction-filters/transaction-filters.selector';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';

interface Props {
    readonly isSelected: boolean;
    readonly onSelect: (accountId: number) => void;
    readonly account: AccountWithInstrumentEntityInterface;
}

const rowVariants = cva('flex-row items-center gap-x-xl px-xl py-lg border-t border-secondary-corner/50', {
    variants: {
        isSelected: {
            true: 'bg-secondary-corner/40',
            false: 'bg-transparent'
        }
    }
});

export const AccountFilterCard = ({ isSelected, account, onSelect }: Props) => {
    const { t } = useLingui();
    const { syncs } = useAnalyticsHistorySyncsQuery();
    const history = syncs.find(row => row.account.id === account.id);
    const formatDigits = useDisplayFormatDigits();

    const { balance } = useAccountBalanceQuery(account.id);

    const historyStatus = isDefined(history) ? t(getHistoryImportStatusMessage(history.sync)) : null;

    const handleSelect = () => void onSelect(account.id);

    const checkboxProps = isSelected ? { testID: TransactionFiltersSelector.AccountOptionSelected(account.title) } : {};
    const accessibilityState = { checked: isSelected };

    return (
        <HapticPressable
            onPress={handleSelect}
            className={rowVariants({ isSelected })}
            accessibilityRole="checkbox"
            accessibilityState={accessibilityState}
            testID={TransactionFiltersSelector.AccountOption(account.title)}
        >
            <CircleIcon icon={account.icon} variant="ghost" size={38} iconSize={18} />

            <View className="flex-1 gap-y-xxs">
                <Text className="text-md font-semibold text-primary" numberOfLines={1}>
                    {account.title}
                </Text>

                <ProtectedText className="text-xs text-secondary-foreground" numberOfLines={1}>
                    {formatDigits(balance, account.instrument.symbol)}
                </ProtectedText>

                {isDefined(historyStatus) ? <Text className="text-xs text-secondary-foreground">{historyStatus}</Text> : null}
            </View>

            <FilterSheetCheckbox isSelected={isSelected} {...checkboxProps} />
        </HapticPressable>
    );
};
