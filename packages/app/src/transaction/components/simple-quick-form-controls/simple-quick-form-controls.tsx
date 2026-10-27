import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useRef } from 'react';
import { View } from 'react-native';

import { useSimpleQuickForm } from '../../context/simple-quick-form.context';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormSplit } from '../../hook/use-quick-form-split.hook';
import { useQuickFormSubmit } from '../../hook/use-quick-form-submit.hook';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAccountRow, TransactionAccountRowRef } from '../transaction-account-row/transaction-account-row';
import { TransactionCategoryFieldIcon } from '../transaction-category-field-icon/transaction-category-field-icon';
import { TransactionDateFieldIcon } from '../transaction-date-field-icon/transaction-date-field-icon';
import { TransactionFieldIconRef } from '../transaction-field-icon/transaction-field-icon';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';
import { TransactionNoteFieldIcon } from '../transaction-note-field-icon/transaction-note-field-icon';
import { TransactionSplitFieldIcon } from '../transaction-split-field-icon/transaction-split-field-icon';
import { TransactionTagsFieldIcon } from '../transaction-tags-field-icon/transaction-tags-field-icon';

export const SimpleQuickFormControls = () => {
    const {
        variant,
        transactionType,
        accountFieldName,
        currencySymbol,
        keypadHandlers,
        setFromNumeric,
        formState,
        amountDisplayRef,
        onSubmit,
        onCancel
    } = useSimpleQuickForm();
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const entryType = transactionType === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
    const { handleSplitIconPress } = useQuickFormSplit({
        accountFieldName,
        currencySymbol,
        entryType,
        transactionType,
        variant,
        setFromNumeric
    });
    const categoryIconRef = useRef<TransactionFieldIconRef>(null);
    const accountRowRef = useRef<TransactionAccountRowRef>(null);
    const { handleConfirm } = useQuickFormSubmit({
        accountFieldName,
        amountDisplayRef,
        categoryIconRef,
        accountRowRef,
        entryType,
        isSplitActive: formState.isSplitActive,
        mccCategoryId: formState.mccCategoryId,
        transactionType,
        onSubmit
    });

    return (
        <>
            <TransactionFieldIcons>
                <TransactionSplitFieldIcon
                    variant={variant}
                    splitEntryCount={formState.splitEntryCount}
                    isAmountPositive={formState.isAmountPositive}
                    onPress={handleSplitIconPress}
                />
                <TransactionDateFieldIcon variant={variant} onPress={handleDatePress} />
                <TransactionNoteFieldIcon variant={variant} onPress={handleCommentPress} />
                <TransactionTagsFieldIcon variant={variant} />
                <TransactionCategoryFieldIcon ref={categoryIconRef} variant={variant} isSplitActive={formState.isSplitActive} />
            </TransactionFieldIcons>

            <View className="mb-xl gap-sm">
                <TransactionAccountRow
                    ref={accountRowRef}
                    variant={variant}
                    fieldName={accountFieldName}
                    testID={SimpleQuickFormSelector.AccountSelector}
                />
            </View>

            <TransactionKeypad
                variant={variant}
                keypad={keypadHandlers}
                onConfirm={handleConfirm}
                onCancel={onCancel}
                confirmTestID={SimpleQuickFormSelector.SubmitButton}
            />
        </>
    );
};
