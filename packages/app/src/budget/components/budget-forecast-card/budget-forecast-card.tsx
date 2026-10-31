import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { BudgetForecastChart } from '../budget-forecast-chart/budget-forecast-chart';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly tone: BudgetPaceVariant;
    readonly currencySymbol: string;
}

export const BudgetForecastCard = ({ projection, tone, currencySymbol }: Props) => {
    const { t } = useLingui();

    return (
        <View className="gap-y-xl">
            <SectionHeader label={t`Forecast`} />

            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <BudgetForecastChart projection={projection} tone={tone} currencySymbol={currencySymbol} />
            </View>
        </View>
    );
};
