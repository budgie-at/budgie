import { BudgetPeriodSnapshotEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetStatusEnum } from '../../enum/budget-status.enum';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly snapshot: BudgetPeriodSnapshotEntityInterface;
    readonly onPress: () => void;
}

const getStatus = (percentage: number): BudgetStatusEnum => {
    if (percentage >= 100) {
        return BudgetStatusEnum.OVER;
    }

    if (percentage >= 80) {
        return BudgetStatusEnum.WARNING;
    }

    return BudgetStatusEnum.ON_TRACK;
};

export const BudgetHistoryRow = ({ snapshot, onPress }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { formatMonthAndDay } = useFormatDate();

    const spent = convertFromMicroUnits(snapshot.totalSpent);
    const limit = convertFromMicroUnits(snapshot.overallLimit);
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    const status = getStatus(percentage);

    const dateRange = `${formatMonthAndDay(snapshot.periodStart)} - ${formatMonthAndDay(snapshot.periodEnd)}`;
    const spentFormatted = formatMoney(spent, defaultInstrument.symbol);
    const limitFormatted = formatMoney(limit, defaultInstrument.symbol);

    return (
        <Card onPress={onPress} size="md">
            <View className="flex-row items-center justify-between mb-md">
                <Text className="text-primary font-medium">{dateRange}</Text>
                <Icon icon={UserIconNameEnum.ChevronRight} size={20} className="text-secondary-foreground" />
            </View>
            <BudgetProgressBar percentage={percentage} status={status} size="sm" />
            <View className="flex-row justify-between mt-md">
                <Text className="text-secondary-foreground">
                    {spentFormatted} / {limitFormatted}
                </Text>
                <Text className="text-secondary-foreground">{percentage.toFixed(1)}%</Text>
            </View>
        </Card>
    );
};
