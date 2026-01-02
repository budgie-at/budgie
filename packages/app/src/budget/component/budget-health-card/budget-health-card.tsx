import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';

const countTextVariants = cva('text-2xl font-bold', {
    variants: {
        status: {
            warning: 'text-warning-foreground',
            positive: 'text-positive-foreground',
            neutral: 'text-primary'
        }
    },
    defaultVariants: { status: 'neutral' }
});

interface Props {
    readonly categoriesCount: number;
    readonly overBudgetCount: number;
    readonly underBudgetCount: number;
}

export const BudgetHealthCard = ({ categoriesCount, overBudgetCount, underBudgetCount }: Props) => {
    const overBudgetStatus = overBudgetCount > 0 ? 'warning' : 'positive';

    return (
        <Card className="gap-3">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Budget Health</Trans>
            </Text>
            <View className="flex-row justify-between">
                <View className="flex-1 items-center">
                    <Text className={countTextVariants({ status: 'neutral' })}>{categoriesCount}</Text>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Categories</Trans>
                    </Text>
                </View>
                <View className="flex-1 items-center">
                    <Text className={countTextVariants({ status: overBudgetStatus })}>{overBudgetCount}</Text>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Over Budget</Trans>
                    </Text>
                </View>
                <View className="flex-1 items-center">
                    <Text className={countTextVariants({ status: 'positive' })}>{underBudgetCount}</Text>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Under 50%</Trans>
                    </Text>
                </View>
            </View>
        </Card>
    );
};

