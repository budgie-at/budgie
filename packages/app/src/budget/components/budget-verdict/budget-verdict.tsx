import { BudgetPaceStatusEnum } from '@budgie/budget';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { BudgetForecastChart } from '../budget-forecast-chart/budget-forecast-chart';
import { BudgetPaceLegend } from '../budget-pace-legend/budget-pace-legend';
import { BudgetPaceTrack } from '../budget-pace-track/budget-pace-track';
import { BudgetVerdictFigure } from '../budget-verdict-figure/budget-verdict-figure';
import { BudgetVerdictFooter } from '../budget-verdict-footer/budget-verdict-footer';
import { BudgetVerdictHeader } from '../budget-verdict-header/budget-verdict-header';
import { BudgetVerdictOutlook } from '../budget-verdict-outlook/budget-verdict-outlook';
import { BudgetVerdictSpent } from '../budget-verdict-spent/budget-verdict-spent';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
    readonly periodEnd: Date;
}

const ENTERING_DURATION = 240;
const ENTERING = FadeIn.duration(ENTERING_DURATION);

export const BudgetVerdict = ({ projection, currencySymbol, periodEnd }: Props) => {
    const { overall, upcomingCharges } = projection;

    return (
        <Animated.View entering={ENTERING}>
            <Card className="gap-y-lg">
                <BudgetVerdictHeader scope={overall} daysLeft={projection.daysLeft} currencySymbol={currencySymbol} />

                <View className="gap-y-xs">
                    <BudgetVerdictFigure scope={overall} currencySymbol={currencySymbol} />
                    <BudgetVerdictOutlook scope={overall} currencySymbol={currencySymbol} periodEnd={periodEnd} />
                    <BudgetVerdictSpent scope={overall} currencySymbol={currencySymbol} />
                </View>

                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="gap-y-lg">
                    <BudgetPaceTrack scope={overall} />
                    <BudgetPaceLegend scope={overall} currencySymbol={currencySymbol} />
                    {overall.status === BudgetPaceStatusEnum.TOO_EARLY ? null : (
                        <BudgetForecastChart projection={projection} currencySymbol={currencySymbol} />
                    )}
                </View>

                {isNotEmptyArray(upcomingCharges) ? (
                    <BudgetVerdictFooter upcoming={overall.upcoming} count={upcomingCharges.length} currencySymbol={currencySymbol} />
                ) : null}
            </Card>
        </Animated.View>
    );
};
