import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { SplitEntryCard } from '../split-entry-card/split-entry-card';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly activeEntryIndex: number;
    readonly currencySymbol: string;
    readonly onSelectEntry: (index: number) => void;
    readonly onAddEntry: () => void;
}

const MAX_LIST_HEIGHT = 240;
const scrollViewStyle = { maxHeight: MAX_LIST_HEIGHT };

export const SplitEntryList = (props: Props) => {
    const { entries, activeEntryIndex, currencySymbol, onSelectEntry, onAddEntry } = props;

    const itemCount = entries.length;

    return (
        <View className="gap-y-sm">
            <View className="flex-row items-center justify-between px-sm">
                <Text className="text-xs font-medium text-tertiary">
                    <Trans>{itemCount} items</Trans>
                </Text>
            </View>

            <ScrollView style={scrollViewStyle} className="gap-y-xs">
                {entries.map((entry, index) => {
                    const isActive = index === activeEntryIndex;
                    const handlePress = () => void onSelectEntry(index);

                    const categoryId = entry.categoryId ?? 0;

                    return (
                        <SplitEntryCard
                            key={index}
                            categoryId={categoryId}
                            amount={entry.amount}
                            currencySymbol={currencySymbol}
                            isActive={isActive}
                            index={index}
                            onPress={handlePress}
                        />
                    );
                })}
            </ScrollView>

            <HapticPressable className="flex-row items-center justify-center gap-x-sm py-sm" onPress={onAddEntry}>
                <Icon icon={UserIconNameEnum.Plus} size={16} className="text-primary" />
                <Text className="text-sm font-medium text-primary">
                    <Trans>Add item</Trans>
                </Text>
            </HapticPressable>
        </View>
    );
};
