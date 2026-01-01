import { BudgetEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { BudgetCard } from '../budget-card/budget-card';
import { BudgetEmptyState } from '../budget-empty-state/budget-empty-state';

interface Props {
    readonly budgets: BudgetEntityInterface[];
}

export const BudgetList = ({ budgets }: Props) => {
    if (!isNotEmptyArray(budgets)) {
        return <BudgetEmptyState />;
    }

    return (
        <View className="gap-y-xl">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Budgets</Trans>
            </Text>

            <View className="flex-row flex-wrap -mx-1.5 gap-y-3 pb-7.5">
                {budgets.map(budget => (
                    <View className="w-full px-1.5" key={budget.id}>
                        <BudgetCard budget={budget} />
                    </View>
                ))}
            </View>
        </View>
    );
};
