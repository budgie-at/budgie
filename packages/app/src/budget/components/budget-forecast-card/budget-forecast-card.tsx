import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { BudgetForecastChart } from '../budget-forecast-chart/budget-forecast-chart';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

export const BudgetForecastCard = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-lg">
            <SectionHeader label={t`Forecast`} />

            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <BudgetForecastChart projection={projection} currencySymbol={currencySymbol} />
            </View>
        </View>
    );
};
