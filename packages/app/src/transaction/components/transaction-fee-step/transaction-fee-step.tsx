import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import * as Effect from 'effect/Effect';
import { TextInput, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetTitle } from '../../../@generic/component/sheet-title/sheet-title';
import { useMorphingSheetDismiss } from '../../../@generic/context/morphing-sheet.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { SplitEntryRow } from '../split-entry-row/split-entry-row';
import { TransactionFeeModalContentSelector } from '../transaction-fee-modal-content/transaction-fee-modal-content.selector';
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
                        dismiss();
                    }
                })
            )
        );

    return (
        <View className="px-xl gap-lg pb-xl">
            <SheetTitle title={t`Fee`} />

            <GroupedListSection>
                <SplitEntryRow
                    index={ROW_INDEX}
                    entry={feeEntry}
                    currencySymbol={currencySymbol}
                    autoFocus={!isExisting}
                    amountRef={amountRef}
                    onAmountChange={onAmountChange}
                    onCategoryPress={onCategoryPress}
                />
            </GroupedListSection>

            <View className="flex-row items-center gap-x-md">
                {isExisting ? (
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
        </View>
    );
};
