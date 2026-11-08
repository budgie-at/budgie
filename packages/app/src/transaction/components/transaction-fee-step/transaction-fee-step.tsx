import { t } from '@lingui/core/macro';
import { TextInput, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetTitle } from '../../../@generic/component/sheet-title/sheet-title';
import { useMorphingSheetDismiss } from '../../../@generic/context/morphing-sheet.context';
import { SplitEntryRow } from '../split-entry-row/split-entry-row';
import { TransactionFeeRemoveButton } from '../transaction-fee-remove-button/transaction-fee-remove-button';
import { TransactionFeeSaveButton } from '../transaction-fee-save-button/transaction-fee-save-button';

import type { TransactionFeeModalResult } from '../../context/transaction-fee-modal.context';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';
import type { Ref } from 'react';

interface Props {
    readonly feeEntry: TransactionEntryCreateInputInterface;
    readonly currencySymbol: string;
    readonly isExisting: boolean;
    readonly amountRef: Ref<TextInput>;
    readonly onAmountChange: (amount: number) => void;
    readonly onCategoryPress: () => void;
    readonly onConfirm: (result: TransactionFeeModalResult) => void;
}

const ROW_INDEX = 0;

export const TransactionFeeStep = (props: Props) => {
    const { feeEntry, currencySymbol, isExisting, amountRef, onAmountChange, onCategoryPress, onConfirm } = props;
    const dismiss = useMorphingSheetDismiss();

    const canSave = isPositiveNumber(feeEntry.categoryId) && isPositiveNumber(feeEntry.amount);

    const handleConfirm = () => {
        onConfirm([feeEntry]);
        dismiss();
    };

    const handleRemoveConfirmed = () => {
        onConfirm([]);
        dismiss();
    };

    return (
        <View className="px-xl gap-lg pb-xl">
            <SheetTitle title={t`Fee`} />

            <GroupedListSection>
                <SplitEntryRow
                    index={ROW_INDEX}
                    entry={feeEntry}
                    currencySymbol={currencySymbol}
                    amountRef={amountRef}
                    onAmountChange={onAmountChange}
                    onCategoryPress={onCategoryPress}
                />
            </GroupedListSection>

            <View className="flex-row items-center gap-x-md">
                {isExisting ? <TransactionFeeRemoveButton onRemove={handleRemoveConfirmed} /> : null}

                <View className="flex-1">
                    <TransactionFeeSaveButton isDisabled={!canSave} onPress={handleConfirm} />
                </View>
            </View>
        </View>
    );
};
