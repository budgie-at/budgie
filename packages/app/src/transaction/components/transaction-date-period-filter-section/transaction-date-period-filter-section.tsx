import { DatePeriodEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { TransactionFilterSectionHeader } from '../transaction-filter-section-header/transaction-filter-section-header';
import { TransactionPeriodFilterItem } from '../transaction-pediod-filter-item/transaction-period-filter-item';

interface Props {
    readonly selectedPeriod: DatePeriodEnum | null;
    readonly onPeriodChange: (period: DatePeriodEnum) => void;
}

export const TransactionDatePeriodFilterSection = ({ selectedPeriod, onPeriodChange }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-1">
            <TransactionFilterSectionHeader title={t`Time Period`} />

            <View className="flex-row flex-wrap -mx-xs gap-y-md">
                {Object.values(DatePeriodEnum).map(period => (
                    <TransactionPeriodFilterItem
                        key={period}
                        period={period}
                        selectedPeriod={selectedPeriod}
                        onPeriodChange={onPeriodChange}
                    />
                ))}
            </View>
        </View>
    );
};
