import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly snapshotId: number | null;
}

export const BudgetHistoryBarButton = ({ label, snapshotId }: Props) => {
    if (!isDefined(snapshotId)) {
        return <View accessible accessibilityLabel={label} className="flex-1" />;
    }

    const handlePress = () => {
        router.push({ pathname: '/budget-period-summary', params: { snapshotId: String(snapshotId) } });
    };

    return (
        <HapticPressable accessibilityLabel={label} accessibilityRole="button" className="flex-1 active:opacity-70" onPress={handlePress} />
    );
};
