import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxPaymentsSelectAll = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { includedRows, setExcluded } = useCategorizeInboxContext();

    const rowCount = cluster.rows.length;
    const isAllSelected = includedRows(cluster).length === rowCount;
    const label = isAllSelected ? <Trans>Deselect all</Trans> : <Trans>Select all</Trans>;

    const handlePress = (): void =>
        void setExcluded(
            cluster.rows.map(row => row.transactionId),
            isAllSelected
        );

    return (
        <View className="flex-row items-center justify-between pt-md">
            <Text className="text-secondary-foreground px-3xl text-[15px] tabular-nums" numberOfLines={1}>
                {t({ message: plural(rowCount, { one: '# payment', other: '# payments' }) })}
            </Text>
            <HapticPressable
                onPress={handlePress}
                accessibilityRole="button"
                className="min-h-[44px] justify-center px-3xl active:opacity-70"
            >
                <Text className="text-primary text-[15px] font-semibold" numberOfLines={1}>
                    {label}
                </Text>
            </HapticPressable>
        </View>
    );
};
