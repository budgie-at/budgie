import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PACE_STATUS_LABEL } from '../../constant/budget-pace-status-label.constant';
import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';
import { BudgetForecastChart } from '../budget-forecast-chart/budget-forecast-chart';
import { BudgetPaceLegend } from '../budget-pace-legend/budget-pace-legend';
import { BudgetPaceTrack } from '../budget-pace-track/budget-pace-track';
import { BudgetVerdictFooter } from '../budget-verdict-footer/budget-verdict-footer';
import { BudgetVerdictHeader } from '../budget-verdict-header/budget-verdict-header';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
    readonly periodEnd: Date;
}

const ENTERING_DURATION = 240;
const ENTERING = FadeIn.duration(ENTERING_DURATION);

export const BudgetVerdict = ({ projection, currencySymbol, periodEnd }: Props) => {
    const { t } = useLingui();
    const { overall, daysLeft, upcomingCharges } = projection;
    const labels = useBudgetProgressLabels(overall.spent, overall.limit, currencySymbol, useAtomValue(decimalPlacesAtom));
    const formatProtectedAmount = useProtectedAmountLabel();
    const { formatMonthAndDay } = useFormatDate();

    const isOver = overall.status === BudgetPaceStatusEnum.OVER;
    const statusLabel = t(BUDGET_PACE_STATUS_LABEL[overall.status]);
    const daysLeftLabel = t({ message: plural(daysLeft, { one: '# day left', other: '# days left' }) });
    const periodEndLabel = formatMonthAndDay(periodEnd);
    const safePerDayAmount = formatProtectedAmount(convertFromMicroUnits(overall.safePerDay), currencySymbol);
    const overAmount = formatProtectedAmount(convertFromMicroUnits(overall.spent - overall.limit), currencySymbol);
    const freeAmount = formatProtectedAmount(convertFromMicroUnits(Math.max(overall.free, 0)), currencySymbol);
    const projectedOverAmount = formatProtectedAmount(convertFromMicroUnits(overall.projectedOver ?? 0), currencySymbol);
    const mainLabel = isOver ? t`${overAmount} over` : safePerDayAmount;
    const figureAccessibilityLabel = isOver ? t`${overAmount} over` : t`${safePerDayAmount} per day`;
    const hasProjectedOver = isOver && isPositiveNumber(overall.projectedOver ?? 0);
    const outlookLabel = isOver
        ? t`Projected ${projectedOverAmount} over by ${periodEndLabel}`
        : t`${freeAmount} free until ${periodEndLabel}`;
    const accessibilityLabel = t`${statusLabel}. ${figureAccessibilityLabel}, ${daysLeftLabel}.`;
    const mainClassName = isOver ? 'text-destructive-foreground' : 'text-primary';
    const dayUnit = isOver ? null : (
        <Text className="text-md text-secondary-foreground">
            <Trans>/ day</Trans>
        </Text>
    );
    const outlook =
        isOver && !hasProjectedOver ? null : (
            <Text testID={BudgetSelector.DetailsRemainingLabel} className="text-sm text-secondary-foreground">
                {outlookLabel}
            </Text>
        );
    const chart =
        overall.status === BudgetPaceStatusEnum.TOO_EARLY ? null : (
            <BudgetForecastChart projection={projection} currencySymbol={currencySymbol} />
        );
    const footer = isNotEmptyArray(upcomingCharges) ? (
        <BudgetVerdictFooter upcoming={overall.upcoming} count={upcomingCharges.length} currencySymbol={currencySymbol} />
    ) : null;

    return (
        <Animated.View entering={ENTERING}>
            <Card className="gap-y-lg">
                <BudgetVerdictHeader
                    status={overall.status}
                    statusLabel={statusLabel}
                    daysLeftLabel={daysLeftLabel}
                    accessibilityLabel={accessibilityLabel}
                />

                <View className="gap-y-xs">
                    <View className="flex-row items-baseline gap-x-sm">
                        <ProtectedText className={cn('text-3xl font-bold tabular-nums', mainClassName)}>{mainLabel}</ProtectedText>
                        {dayUnit}
                    </View>
                    {outlook}
                    <View className="flex-row items-baseline gap-x-sm">
                        <ProtectedText testID={BudgetSelector.DetailsSpentLabel} className="text-sm tabular-nums text-secondary-foreground">
                            {labels.amountLabel}
                        </ProtectedText>
                        <Text className="text-sm tabular-nums text-secondary-foreground">{labels.percentLabel}</Text>
                    </View>
                </View>

                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="gap-y-lg">
                    <BudgetPaceTrack scope={overall} />
                    <BudgetPaceLegend scope={overall} currencySymbol={currencySymbol} />
                    {chart}
                </View>

                {footer}
            </Card>
        </Animated.View>
    );
};
