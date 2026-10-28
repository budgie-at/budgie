import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { BudgetForecastChart } from '../budget-forecast-chart/budget-forecast-chart';
import { BudgetForecastLegend } from '../budget-forecast-legend/budget-forecast-legend';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

export const BudgetForecastCard = ({ projection, currencySymbol }: Props) => (
    <Card className="gap-y-lg">
        <Text className="text-xxs uppercase tracking-wider text-secondary-foreground">
            <Trans>Spending forecast</Trans>
        </Text>

        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="gap-y-lg">
            <BudgetForecastChart projection={projection} currencySymbol={currencySymbol} />
            <BudgetForecastLegend projection={projection} currencySymbol={currencySymbol} />
        </View>
    </Card>
);
