import { DatePeriodEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { DATE_PERIOD } from '../../../@generic/constant/date-period.constant';
import { TransactionFilterCard } from '../transaction-filter-card/transaction-filter-card';

interface Props {
    readonly period: DatePeriodEnum;
    readonly selectedPeriod: DatePeriodEnum | null;
    readonly onPeriodChange: (period: DatePeriodEnum) => void;
}

export const TransactionPeriodFilterItem = ({ period, selectedPeriod, onPeriodChange }: Props) => {
    const { i18n } = useLingui();

    const isSelected = period === selectedPeriod;
    const handlePress = () => void onPeriodChange(period);

    return (
        <View className="w-1/2 px-xs">
            <TransactionFilterCard isSelected={isSelected} onPress={handlePress} icon="Calendar" label={i18n.t(DATE_PERIOD[period])} />
        </View>
    );
};
