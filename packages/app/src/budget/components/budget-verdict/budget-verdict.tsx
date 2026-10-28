import { BudgetPaceStatusEnum } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { MessageDescriptor } from '@lingui/core';
import { msg, plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card } from '../../../@generic/component/card/card';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { BudgetSelector } from '../../budget.selector';
import { useBudgetProgressLabels } from '../../hooks/use-budget-progress-labels.hook';
import { BudgetForecastChart } from '../budget-forecast-chart/budget-forecast-chart';
import { BudgetPaceLegend } from '../budget-pace-legend/budget-pace-legend';
import { BudgetPaceTrack } from '../budget-pace-track/budget-pace-track';
import { BudgetVerdictHeader } from '../budget-verdict-header/budget-verdict-header';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

const ENTERING_DURATION = 240;
const ENTERING = FadeIn.duration(ENTERING_DURATION);
const STATUS_LABEL: Record<BudgetPaceStatusEnum, MessageDescriptor> = {
    [BudgetPaceStatusEnum.ON_TRACK]: msg`On track`,
    [BudgetPaceStatusEnum.TOO_EARLY]: msg`On track`,
    [BudgetPaceStatusEnum.AHEAD]: msg`Ahead of pace`,
    [BudgetPaceStatusEnum.OVER]: msg`Over budget`
};

export const BudgetVerdict = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const { overall, daysLeft } = projection;
    const labels = useBudgetProgressLabels(overall.spent, overall.limit, currencySymbol, useAtomValue(decimalPlacesAtom));
    const formatProtectedAmount = useProtectedAmountLabel();

    const statusLabel = t(STATUS_LABEL[overall.status]);
    const daysLeftLabel = t({ message: plural(daysLeft, { one: '# day left', other: '# days left' }) });
    const spentAmount = formatProtectedAmount(convertFromMicroUnits(overall.spent), currencySymbol);
    const limitAmount = formatProtectedAmount(convertFromMicroUnits(overall.limit), currencySymbol);
    const upcomingAmount = formatProtectedAmount(convertFromMicroUnits(overall.upcoming), currencySymbol);
    const accessibilityLabel = t`${statusLabel}: spent ${spentAmount} of ${limitAmount}, ${upcomingAmount} reserved for upcoming bills, ${daysLeftLabel}.`;
    const chart =
        overall.status === BudgetPaceStatusEnum.TOO_EARLY ? null : (
            <BudgetForecastChart projection={projection} currencySymbol={currencySymbol} />
        );

    return (
        <Animated.View entering={ENTERING}>
            <Card className="gap-y-lg">
                <BudgetVerdictHeader
                    status={overall.status}
                    statusLabel={statusLabel}
                    daysLeftLabel={daysLeftLabel}
                    accessibilityLabel={accessibilityLabel}
                />

                <View className="flex-row items-baseline justify-between gap-x-md">
                    <ProtectedText testID={BudgetSelector.DetailsSpentLabel} className="text-xl font-bold tabular-nums text-primary">
                        {labels.amountLabel}
                    </ProtectedText>
                    <Text className="text-sm tabular-nums text-secondary-foreground">{labels.percentLabel}</Text>
                </View>

                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="gap-y-lg">
                    <BudgetPaceTrack scope={overall} />
                    <BudgetPaceLegend scope={overall} currencySymbol={currencySymbol} />
                    {chart}
                </View>

                <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-secondary-foreground">{labels.remainingLabel}</Text>
                    <ProtectedText
                        testID={BudgetSelector.DetailsRemainingLabel}
                        className="text-md font-semibold tabular-nums text-primary"
                    >
                        {labels.remainingAmountLabel}
                    </ProtectedText>
                </View>
            </Card>
        </Animated.View>
    );
};
