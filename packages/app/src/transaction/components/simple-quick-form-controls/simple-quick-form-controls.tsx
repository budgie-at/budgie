import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode, RefObject, useRef } from 'react';
import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useQuickFormModals } from '../../hook/use-quick-form-modals.hook';
import { useQuickFormSplit } from '../../hook/use-quick-form-split.hook';
import { useQuickFormSubmit } from '../../hook/use-quick-form-submit.hook';
import { QuickFormFieldError } from '../quick-form-field-error/quick-form-field-error';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAccountRow, TransactionAccountRowRef } from '../transaction-account-row/transaction-account-row';
import { TransactionCategoryFieldIcon } from '../transaction-category-field-icon/transaction-category-field-icon';
import { TransactionDateTagsRow } from '../transaction-date-tags-row/transaction-date-tags-row';
import { TransactionFieldIconRef } from '../transaction-field-icon/transaction-field-icon';
import { TransactionFieldIcons } from '../transaction-field-icons/transaction-field-icons';
import { TransactionNoteFieldIcon } from '../transaction-note-field-icon/transaction-note-field-icon';
import { TransactionSplitFieldIcon } from '../transaction-split-field-icon/transaction-split-field-icon';

import type { useSimpleQuickFormState } from '../../hook/use-simple-quick-form-state.hook';
import type { TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';

interface Props {
    readonly transactionType: TransactionTypeEnum;
    readonly currencySymbol: string;
    readonly setFromNumeric: (value: number) => void;
    readonly formState: ReturnType<typeof useSimpleQuickFormState>;
    readonly amountDisplayRef: RefObject<TransactionAmountDisplayRef | null>;
    readonly onSubmit: () => void;
    readonly fee: ReactNode;
    readonly children: (fields: ReactNode, onConfirm: () => void) => ReactNode;
}

export const SimpleQuickFormControls = ({
    transactionType,
    currencySymbol,
    setFromNumeric,
    formState,
    amountDisplayRef,
    onSubmit,
    fee,
    children
}: Props) => {
    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;
    const variant = isExpense ? 'destructive' : 'positive';
    const accountFieldName = isExpense ? 'fromAccountId' : 'toAccountId';
    const accountErrorFields = [accountFieldName] as const;
    const { handleCommentPress, handleDatePress } = useQuickFormModals();
    const entryType = isExpense ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
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

    return children(
        <View className="gap-y-[12px]">
            <GroupedListSection footer={<QuickFormFieldError fields={accountErrorFields} />}>
                <TransactionAccountRow ref={accountRowRef} fieldName={accountFieldName} testID={SimpleQuickFormSelector.AccountSelector} />
                <TransactionCategoryFieldIcon ref={categoryIconRef} variant={variant} isSplitActive={formState.isSplitActive} />
            </GroupedListSection>
            <TransactionFieldIcons>
                <TransactionDateTagsRow onDatePress={handleDatePress} />
                {fee}
                <TransactionNoteFieldIcon onPress={handleCommentPress} />
            </TransactionFieldIcons>
            <TransactionSplitFieldIcon
                splitEntryCount={formState.splitEntryCount}
                isAmountPositive={formState.isAmountPositive}
                onPress={handleSplitIconPress}
            />
        </View>,
        handleConfirm
    );
};
