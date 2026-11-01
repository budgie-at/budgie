import { router } from 'expo-router';
import { View } from 'react-native';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useBudgetDetailsData } from '../../hooks/use-budget-details-data.hook';
import { BudgetDetailsEditButton } from '../budget-details-edit-button/budget-details-edit-button';
import { BudgetDetailsOverview } from '../budget-details-overview/budget-details-overview';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetEventDetails = ({ budget }: Props) => {
    const { projection, isLoading, periodStart, periodEnd, currencySymbol, dateLabel } = useBudgetDetailsData(budget);

    const handleFigurePress = () => {
        router.push({ pathname: '/budget-safe-to-spend', params: { eventId: String(budget.id) } });
    };

    const handleEditPress = () => {
        router.push({ pathname: '/budget/event/[id]/edit', params: { id: String(budget.id) } });
    };

    return (
        <CollapsibleChromePage
            title={budget.name}
            subtitle={dateLabel}
            leading={<HeaderBackButton />}
            trailing={<BudgetDetailsEditButton onPress={handleEditPress} />}
        >
            <View collapsable={false} className="gap-y-3xl">
                <BudgetDetailsOverview
                    budget={budget}
                    projection={projection}
                    isLoading={isLoading}
                    currencySymbol={currencySymbol}
                    periodStart={periodStart}
                    periodEnd={periodEnd}
                    onFigurePress={handleFigurePress}
                />
            </View>
        </CollapsibleChromePage>
    );
};
