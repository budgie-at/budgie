import { BANK_FEE_CATEGORY_ID, CategorySourceEnum, TransactionEntryTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetTitle } from '../../../@generic/component/sheet-title/sheet-title';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { SplitEntryRow } from '../split-entry-row/split-entry-row';
import { TransactionFeeSaveButton } from '../transaction-fee-save-button/transaction-fee-save-button';

import { TransactionFeeModalContentSelector } from './transaction-fee-modal-content.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { TransactionFeeModalResult } from '../../context/transaction-fee-modal.context';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
    readonly onConfirm: (result: TransactionFeeModalResult) => void;
}

const ROW_INDEX = 0;
const CONTENT_CONTAINER_STYLE = { flexGrow: 1 };

export const TransactionFeeModalContent = ({ accountId, currencySymbol, entry, variant, onConfirm }: Props) => {
    const { bottom, top } = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const { progress, height } = useReanimatedKeyboardAnimation();
    const sheetStyle = useAnimatedStyle(() => ({ maxHeight: windowHeight - top - Math.abs(height.value) - 24 }));
    const bottomPaddingStyle = useAnimatedStyle(() => ({ paddingBottom: interpolate(progress.value, [0, 1], [Math.max(bottom, 16), 16]) }));
    const [openCategorySelector] = useCategorySelectorModal();
    const { account } = useGetAccountByIdQuery(accountId);
    const [feeEntry, setFeeEntry] = useState<TransactionEntryCreateInputInterface>(
        entry ?? {
            accountId,
            categoryId: BANK_FEE_CATEGORY_ID,
            categorySource: CategorySourceEnum.FEE,
            amount: 0,
            type: TransactionEntryTypeEnum.FEE,
            mccCategoryId: null,
            externalId: null
        }
    );

    const canSave = isPositiveNumber(feeEntry.categoryId) && isPositiveNumber(feeEntry.amount);

    const handleAmountChange = (amount: number) => {
        setFeeEntry(previous => ({ ...previous, amount }));
    };

    const handleCategoryPress = () => {
        openCategorySelector(
            { initialCategoryId: feeEntry.categoryId, variant, ...(isDefined(account) && { syncZone: account.syncZone }) },
            selectedCategoryId => {
                if (isDefined(selectedCategoryId)) {
                    const categorySource = selectedCategoryId === BANK_FEE_CATEGORY_ID ? CategorySourceEnum.FEE : CategorySourceEnum.USER;

                    setFeeEntry(previous => ({ ...previous, categoryId: selectedCategoryId, categorySource }));
                }
            }
        );
    };

    const handleConfirm = () => {
        onConfirm([feeEntry]);
    };

    const handleRemove = () =>
        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const confirmed = yield* confirmAlert({
                        title: t`Remove fee?`,
                        message: t`This will remove the fee entry from this transaction.`,
                        confirmText: t`Remove fee`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    });

                    if (confirmed) {
                        onConfirm([]);
                    }
                })
            )
        );

    return (
        <Animated.View className="bg-sheet-surface" style={sheetStyle}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={CONTENT_CONTAINER_STYLE}>
                <Animated.View className="px-xl gap-lg" style={bottomPaddingStyle}>
                    <SheetTitle title={t`Fee`} />

                    <GroupedListSection>
                        <SplitEntryRow
                            index={ROW_INDEX}
                            entry={feeEntry}
                            currencySymbol={currencySymbol}
                            autoFocus={!isDefined(entry)}
                            onAmountChange={handleAmountChange}
                            onCategoryPress={handleCategoryPress}
                        />
                    </GroupedListSection>

                    <View className="flex-row items-center gap-x-md">
                        {isDefined(entry) ? (
                            <Button
                                leftIcon={UserIconNameEnum.X}
                                variant="destructive"
                                size="md"
                                className="aspect-square"
                                onPress={handleRemove}
                                testID={TransactionFeeModalContentSelector.RemoveButton}
                            />
                        ) : null}

                        <View className="flex-1">
                            <TransactionFeeSaveButton isDisabled={!canSave} onPress={handleConfirm} />
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </Animated.View>
    );
};
