import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly elapsedFraction: number;
}

const TODAY_LABEL_WIDTH = 64;
const TODAY_LABEL_MIN_FRACTION = 0.15;
const TODAY_LABEL_MAX_FRACTION = 0.85;
const PERCENT_MULTIPLIER = 100;

export const BudgetPaceTicks = ({ periodStart, periodEnd, elapsedFraction }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const labelFraction = Math.min(Math.max(elapsedFraction, TODAY_LABEL_MIN_FRACTION), TODAY_LABEL_MAX_FRACTION);
    const todayLeft: `${number}%` = `${labelFraction * PERCENT_MULTIPLIER}%`;

    return (
        <View className="mt-sm h-4 flex-row justify-between">
            <Text className="text-xxs text-secondary-foreground">{formatMonthAndDay(periodStart)}</Text>
            <View
                className="absolute items-center"
                style={{ left: todayLeft, width: TODAY_LABEL_WIDTH, marginLeft: -TODAY_LABEL_WIDTH / 2 }}
            >
                <Text className="text-xxs text-secondary-foreground">{t`today`}</Text>
            </View>
            <Text className="text-xxs text-secondary-foreground">{formatMonthAndDay(periodEnd)}</Text>
        </View>
    );
};
