import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { useSplitEntriesEditor } from '../../hook/use-split-entries-editor.hook';
import { useSplitEntriesSubmit } from '../../hook/use-split-entries-submit.hook';
import { EntryWithLocalIdInterface } from '../../utils/entry-with-local-id.util';
import { SplitEntriesAddItemFooter } from '../split-entries-add-item-footer/split-entries-add-item-footer';
import { SplitEntriesItem } from '../split-entries-item/split-entries-item';
import { SplitEntriesModalContentSelector } from '../split-entries-modal-content/split-entries-modal-content.selector';
import { SplitEntriesRemainder } from '../split-entries-remainder/split-entries-remainder';

const CONTENT_CONTAINER_STYLE = { paddingHorizontal: 16, paddingBottom: 12 };

interface Props {
    readonly entries: EntryWithLocalIdInterface[];
    readonly isInitiallySplit: boolean;
    readonly entryType: TransactionEntryTypeEnum;
    readonly currencySymbol: string;
    readonly totalAmount: number;
    readonly onEntriesChange: (entries: EntryWithLocalIdInterface[]) => void;
    readonly onCategoryPress: (index: number) => void;
    readonly onConfirm: (entries: TransactionEntryCreateInputInterface[]) => void;
}

export const SplitEntriesStep = (props: Props) => {
    const { entries, isInitiallySplit, entryType, currencySymbol, totalAmount, onEntriesChange, onCategoryPress, onConfirm } = props;
    const { height: windowHeight } = useWindowDimensions();
    const { top } = useSafeAreaInsets();
    const { height } = useReanimatedKeyboardAnimation();
    const sheetStyle = useAnimatedStyle(() => ({ maxHeight: windowHeight - top - Math.abs(height.value) - 24 }));
    const {
        autoFocusId,
        canAddEntry,
        canRemoveSplit,
        remainingAmount,
        isFullySplit,
        isOverBudget,
        hasMissingCategories,
        canConfirm,
        handleAmountChange,
        handleAddEntry,
        handleRemoveEntry
    } = useSplitEntriesEditor({ entries, isInitiallySplit, entryType, totalAmount, onEntriesChange });
    const { handleConfirm, handleRemoveSplit } = useSplitEntriesSubmit(entries, totalAmount, onConfirm);

    return (
        <Animated.View className="bg-sheet-surface" style={sheetStyle}>
            <ScrollView contentContainerStyle={CONTENT_CONTAINER_STYLE} keyboardShouldPersistTaps="handled">
                <SheetTitleRow title={t`Split`} trailing={<View />} />
                <GroupedListSection>
                    {entries.map((entry, index) => (
                        <SplitEntriesItem
                            key={entry.localId}
                            entry={entry}
                            index={index}
                            currencySymbol={currencySymbol}
                            autoFocus={entry.localId === autoFocusId}
                            entryCount={entries.length}
                            onAmountChange={handleAmountChange}
                            onCategoryPress={onCategoryPress}
                            onDelete={handleRemoveEntry}
                        />
                    ))}
                </GroupedListSection>
                <SplitEntriesAddItemFooter canAddEntry={canAddEntry} onAddEntry={handleAddEntry} />
                <SplitEntriesRemainder
                    canConfirm={canConfirm}
                    remainingAmount={remainingAmount}
                    currencySymbol={currencySymbol}
                    isFullySplit={isFullySplit}
                    isOverBudget={isOverBudget}
                    hasMissingCategories={hasMissingCategories}
                />
                {canRemoveSplit ? (
                    <View className="pt-xl">
                        <GroupedListSection>
                            <HapticPressable
                                onPress={handleRemoveSplit}
                                accessibilityRole="button"
                                className="min-h-[44px] justify-center px-3xl py-md"
                                testID={SplitEntriesModalContentSelector.RemoveSplitButton}
                            >
                                <Text className="text-md text-destructive-strong">
                                    <Trans>Remove split</Trans>
                                </Text>
                            </HapticPressable>
                        </GroupedListSection>
                    </View>
                ) : null}
                <View className="bg-sheet-surface pt-3xl pb-[16px]">
                    <PillButton
                        label={t`Done`}
                        isDisabled={!canConfirm}
                        onPress={handleConfirm}
                        testID={SplitEntriesModalContentSelector.ConfirmButton}
                    />
                </View>
            </ScrollView>
        </Animated.View>
    );
};
