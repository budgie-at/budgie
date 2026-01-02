import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { BudgetStatItem } from '../budget-stat-item/budget-stat-item';

interface Props {
    readonly categoriesCount: number;
    readonly overBudgetCount: number;
    readonly underBudgetCount: number;
}

export const BudgetHealthCard = ({ categoriesCount, overBudgetCount, underBudgetCount }: Props) => {
    const { t } = useLingui();
    const overBudgetStatus = isPositiveNumber(overBudgetCount) ? 'warning' : 'positive';

    return (
        <Card className="gap-3">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Budget Health</Trans>
            </Text>

            <View className="flex-row justify-between">
                <BudgetStatItem value={categoriesCount} label={t`Categories`} status="neutral" />
                <BudgetStatItem value={overBudgetCount} label={t`Over Budget`} status={overBudgetStatus} />
                <BudgetStatItem value={underBudgetCount} label={t`Under 50%`} status="positive" />
            </View>
        </Card>
    );
};
