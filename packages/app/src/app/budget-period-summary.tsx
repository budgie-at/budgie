import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { BudgetPeriodSummary } from '../budget/components/budget-period-summary/budget-period-summary';

export default function BudgetPeriodSummaryModal() {
    const { snapshotId } = useLocalSearchParams<{ snapshotId: string }>();

    return (
        <View className="bg-sheet-surface" collapsable={false}>
            <BudgetPeriodSummary snapshotId={Number(snapshotId)} />
        </View>
    );
}
