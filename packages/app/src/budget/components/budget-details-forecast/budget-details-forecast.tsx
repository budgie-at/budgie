import { BudgetPaceStatusEnum } from '@budgie/budget';
import { View } from 'react-native';

import { EntranceReveal } from '../../../@generic/component/entrance-reveal/entrance-reveal';
import { BudgetForecastCard } from '../budget-forecast-card/budget-forecast-card';

import type { BudgetPaceVariant } from '../../type/budget-pace-variant.type';
import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly tone: BudgetPaceVariant;
    readonly currencySymbol: string;
    readonly isLoading: boolean;
}

export const BudgetDetailsForecast = ({ projection, tone, currencySymbol, isLoading }: Props) => {
    if (isLoading) {
        return <View className="h-[200px]" />;
    }

    if (projection.overall.status === BudgetPaceStatusEnum.TOO_EARLY) {
        return null;
    }

    return (
        <EntranceReveal step={3}>
            <BudgetForecastCard projection={projection} tone={tone} currencySymbol={currencySymbol} />
        </EntranceReveal>
    );
};
