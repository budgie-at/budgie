import { BudgetPaceStatusEnum } from '@budgie/budget';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { BudgetForecastChart } from '../budget-forecast-chart/budget-forecast-chart';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly tone: BudgetPaceVariant;
    readonly currencySymbol: string;
    readonly isLoading: boolean;
}

export const BudgetDetailsForecast = ({ projection, tone, currencySymbol, isLoading }: Props) => {
    const { t } = useLingui();

    if (isLoading) {
        return <View className="h-[200px]" />;
    }

    if (projection.overall.status === BudgetPaceStatusEnum.TOO_EARLY) {
        return null;
    }

    return (
        <EntranceReveal step={3}>
            <View className="gap-y-xl">
                <SectionHeader label={t`Forecast`} />
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <BudgetForecastChart projection={projection} tone={tone} currencySymbol={currencySymbol} />
                </View>
            </View>
        </EntranceReveal>
    );
};
