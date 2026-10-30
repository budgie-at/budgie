import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

const HIT_SLOP = { top: 14, bottom: 14, left: 8, right: 8 };

export const CategorizeInboxPaymentsSelectAll = ({ cluster }: Props) => {
    const { includedRows, setExcluded } = useCategorizeInboxContext();

    const isAllSelected = includedRows(cluster).length === cluster.rows.length;
    const label = isAllSelected ? <Trans>Deselect all</Trans> : <Trans>Select all</Trans>;

    const handlePress = (): void =>
        void setExcluded(
            cluster.rows.map(row => row.transactionId),
            isAllSelected
        );

    return (
        <HapticPressable onPress={handlePress} accessibilityRole="button" hitSlop={HIT_SLOP}>
            <Text className="text-primary text-sm font-semibold">{label}</Text>
        </HapticPressable>
    );
};
