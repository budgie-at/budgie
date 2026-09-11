import { DEFAULT_RUNWAY_WINDOW, DEFAULT_TRANSACTION_FILTER, RunwayDriverDimensionEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { RUNWAY_MINIMUM_MONTHS } from '../../constant/runway-minimum-months.constant';
import { useLiquidBalanceQuery } from '../../query/use-liquid-balance.query';
import { useRunwayQuery } from '../../query/use-runway.query';
import { RunwaySelector } from '../../runway.selector';
import { RunwayMeter } from '../runway-meter/runway-meter';

// eslint-disable-next-line max-statements -- Widget orchestrates 7 hooks and renders enabled, insufficient-history, and ready states
export const RunwayWidget = () => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const isEnabled = useSetting('isRunwayWidgetEnabled');
    const liquid = useLiquidBalanceQuery();
    const { computation } = useRunwayQuery({
        filters: DEFAULT_TRANSACTION_FILTER,
        window: DEFAULT_RUNWAY_WINDOW,
        dimension: RunwayDriverDimensionEnum.CATEGORY,
        liquid
    });
    const { formatMonthAndYear } = useFormatDate();
    const formatDigits = useFormatDigits(0);

    if (!isEnabled) {
        return null;
    }

    const handleNavigate = () => void router.push('/analytics?tab=runway');

    if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
        return (
            <Card testID={RunwaySelector.WidgetEmptyState} variant="ghost" onPress={handleNavigate} className="gap-y-md">
                <Text className="text-primary font-medium text-md">{t`Runway`}</Text>
                <Text className="text-secondary-foreground text-sm">{t`Not enough history yet`}</Text>
            </Card>
        );
    }

    const { isPositive, net, runwayMonths, runsOutAt } = computation;
    const netAmount = convertFromMicroUnits(net);
    const figure = isPositive ? t`Building` : `≈ ${formatDigits(Math.round(runwayMonths ?? 0))}`;
    const formattedNet = formatDigits(netAmount, defaultInstrument.symbol);
    const runOutDate = isDefined(runsOutAt) ? formatMonthAndYear(runsOutAt) : '';
    const netLabel = t`+${formattedNet} / mo`;
    const runOutLabel = t`Runs out around ${runOutDate}`;
    const dateLabel = isPositive ? netLabel : runOutLabel;

    return (
        <Card testID={RunwaySelector.WidgetCard} variant="ghost" onPress={handleNavigate} className="gap-y-md">
            <View className="flex-row items-center justify-between">
                <Text className="text-primary font-medium text-md">{t`Runway`}</Text>
                <Text testID={RunwaySelector.WidgetDateLabel} className="text-secondary-foreground text-sm">
                    {dateLabel}
                </Text>
            </View>

            <Text testID={RunwaySelector.WidgetFigure} className="text-2xl font-bold text-primary">
                {figure}
            </Text>

            <RunwayMeter months={runwayMonths} isPositive={isPositive} />
        </Card>
    );
};
