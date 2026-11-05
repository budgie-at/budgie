import { TransactionTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { ReactNode, Ref } from 'react';
import { View } from 'react-native';

import { useSimpleQuickForm } from '../../hook/use-simple-quick-form.hook';
import { useTransactionKeypadEditing } from '../../hook/use-transaction-keypad-editing.hook';
import { formatKeypadAmount } from '../../utils/format-keypad-amount.util';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { QuickFormLayout } from '../quick-form-layout/quick-form-layout';
import { QuickFormValidationSlot } from '../quick-form-validation-slot/quick-form-validation-slot';
import { SimpleQuickFormControls } from '../simple-quick-form-controls/simple-quick-form-controls';
import { SuggestionsContainer } from '../suggestions-container/suggestions-container';
import { TransactionAmountDisplay } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';
import { TransactionFormActions } from '../transaction-form-actions/transaction-form-actions';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

import { SimpleQuickFormSelector } from './simple-quick-form.selector';

import type { SimpleQuickFormRefInterface } from '../../interface/simple-quick-form-ref.interface';

interface Props {
    readonly ref?: Ref<SimpleQuickFormRefInterface>;
    readonly transactionType: TransactionTypeEnum;
    readonly aiContext?: string;
    readonly isNewTransaction?: boolean;
    readonly children?: ReactNode;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

export const SimpleQuickForm = (props: Props) => {
    const { ref, transactionType, aiContext = '', isNewTransaction = false, children, onSubmit, onCancel } = props;
    const form = useSimpleQuickForm(transactionType, ref);
    const { formState, amountDisplayRef } = form;
    const { isEditingAmount, toggleKeypad, footerHeight, amountAccessoryIcon, amountAccessibilityHint } =
        useTransactionKeypadEditing(isNewTransaction);
    const displayAmount = isEditingAmount ? form.displayValue : formatKeypadAmount(form.displayValue, '.', '', 2);
    const isConfirmDisabled = !formState.isAmountPositive;

    return (
        <SimpleQuickFormControls
            transactionType={transactionType}
            currencySymbol={form.currencySymbol}
            setFromNumeric={form.setFromNumeric}
            formState={formState}
            amountDisplayRef={amountDisplayRef}
            onSubmit={onSubmit}
        >
            {(fields, onConfirm) => (
                <QuickFormLayout
                    footerHeight={footerHeight}
                    suggestions={
                        <SuggestionsContainer
                            isNewTransaction={isNewTransaction}
                            isSplitActive={formState.isSplitActive}
                            transactionType={transactionType}
                            transactionTitle={formState.title}
                            categoryId={formState.categoryId}
                            isCategoryUserConfirmed={formState.isCategoryUserConfirmed}
                            mccCategoryId={formState.mccCategoryId}
                            comment={formState.comment}
                            aiContext={aiContext}
                            accountId={formState.accountId}
                            amount={formState.amount}
                            hasTagsSelected={formState.hasTagsSelected}
                            onSelectCategory={formState.handleSelectCategory}
                            onSelectTag={formState.handleSelectTag}
                            onSelectComment={formState.handleSelectComment}
                            onFillPatternAmount={formState.handleFillPatternAmount}
                        />
                    }
                    amount={
                        <TransactionAmountDisplay
                            ref={amountDisplayRef}
                            amount={displayAmount}
                            currencySymbol={form.currencySymbol}
                            variant={form.amountVariant}
                            onPress={toggleKeypad}
                            accessoryIcon={amountAccessoryIcon}
                            accessibilityHint={amountAccessibilityHint}
                            testID={SimpleQuickFormSelector.AmountInput}
                        />
                    }
                    context={
                        <View className="items-center gap-y-[8px]">
                            <MccInfoRow transactionTitle={formState.title} mccCategoryId={formState.mccCategoryId}>
                                <TransactionFeePill
                                    amount={form.feeAmount}
                                    currencySymbol={form.currencySymbol}
                                    instrumentType={form.instrumentType}
                                    showEmptyState={isNewTransaction}
                                    onPress={form.handleFeePress}
                                />
                                {children}
                            </MccInfoRow>
                            <QuickFormValidationSlot />
                        </View>
                    }
                    footer={
                        <TransactionFormActions
                            label={t`Save`}
                            isDisabled={isConfirmDisabled}
                            onConfirm={onConfirm}
                            onCancel={onCancel}
                            testID={SimpleQuickFormSelector.SubmitButton}
                        >
                            {isEditingAmount ? <TransactionKeypad keypad={form.keypadHandlers} /> : null}
                        </TransactionFormActions>
                    }
                >
                    <View className="gap-y-[12px]">{fields}</View>
                </QuickFormLayout>
            )}
        </SimpleQuickFormControls>
    );
};
