import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 8, right: 8 };

export const CategorizeInboxPaymentsSelectAll = ({ cluster }: Props) => {
    const { includedRows, setExcluded } = useCategorizeInboxContext();

    const isAllSelected = includedRows(cluster).length === cluster.rows.length;
    const label = isAllSelected ? <Trans>Select none</Trans> : <Trans>Select all</Trans>;

    const handlePress = (): void =>
        void setExcluded(
            cluster.rows.map(row => row.transactionId),
            isAllSelected
        );

    return (
        <HapticPressable
            onPress={handlePress}
            accessibilityRole="button"
            hitSlop={HIT_SLOP}
            className="rounded-full bg-secondary-background px-md py-xs"
        >
            <Text className="text-primary text-xs font-medium">{label}</Text>
        </HapticPressable>
    );
};
