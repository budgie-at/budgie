import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { TextInput, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
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
    readonly onDone?: () => void;
}

const ROW_INDEX = 0;

export const TransactionFeeStep = (props: Props) => {
    const { feeEntry, currencySymbol, isExisting, amountRef, onAmountChange, onCategoryPress, onConfirm, onDone } = props;
    const dismiss = useMorphingSheetDismiss();
    const handleDone = onDone ?? dismiss;
    const closeIcon = isDefined(onDone) ? UserIconNameEnum.ChevronLeft : UserIconNameEnum.X;
    const closeLabel = isDefined(onDone) ? t`Back` : t`Close`;

    const canSave = isPositiveNumber(feeEntry.categoryId) && isPositiveNumber(feeEntry.amount);

    const handleConfirm = () => {
        onConfirm([feeEntry]);
        handleDone();
    };

    const handleRemoveConfirmed = () => {
        onConfirm([]);
        handleDone();
    };

    return (
        <View className="px-xl gap-lg pb-xl">
            <SheetTitleRow title={t`Fee`} closeIcon={closeIcon} closeLabel={closeLabel} trailing={<View />} onClose={handleDone} />

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
