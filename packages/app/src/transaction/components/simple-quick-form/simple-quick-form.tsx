import { TransactionTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { ReactNode, Ref } from 'react';

import { useSimpleQuickForm } from '../../hook/use-simple-quick-form.hook';
import { useTransactionKeypadEditing } from '../../hook/use-transaction-keypad-editing.hook';
import { formatKeypadAmount } from '../../utils/format-keypad-amount.util';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { QuickFormLayout } from '../quick-form-layout/quick-form-layout';
import { SimpleQuickFormControls } from '../simple-quick-form-controls/simple-quick-form-controls';
import { SuggestionsContainer } from '../suggestions-container/suggestions-container';
import { TransactionAmountDisplay } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFeeFieldIcon } from '../transaction-fee-field-icon/transaction-fee-field-icon';
import { TransactionFormActions } from '../transaction-form-actions/transaction-form-actions';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';
import { TransactionMerchantInput } from '../transaction-merchant-input/transaction-merchant-input';

import { SimpleQuickFormSelector } from './simple-quick-form.selector';

import type { SimpleQuickFormRefInterface } from '../../interface/simple-quick-form-ref.interface';

interface Props {
    readonly ref?: Ref<SimpleQuickFormRefInterface>;
    readonly transactionType: TransactionTypeEnum;
    readonly aiContext?: string;
    readonly isNewTransaction?: boolean;
    readonly children?: ReactNode;
    readonly onSubmit: () => void;
}

export const SimpleQuickForm = (props: Props) => {
    const { ref, transactionType, aiContext = '', isNewTransaction = false, children, onSubmit } = props;
    const form = useSimpleQuickForm(transactionType, ref);
    const { formState, amountDisplayRef } = form;
    const { isEditingAmount, toggleKeypad, dismissKeypad, amountAccessibilityHint } = useTransactionKeypadEditing(isNewTransaction);
    const displayAmount = isEditingAmount ? form.displayValue : formatKeypadAmount(form.displayValue, '.', '', 2);
    const isConfirmDisabled = formState.isSubmitting;
    const keypad = isEditingAmount ? <TransactionKeypad keypad={form.keypadHandlers} /> : null;

    const merchant = isNewTransaction ? <TransactionMerchantInput /> : formState.title;
    const suggestions = (
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
    );

    return (
        <SimpleQuickFormControls
            transactionType={transactionType}
            currencySymbol={form.currencySymbol}
            setFromNumeric={form.setFromNumeric}
            formState={formState}
            amountDisplayRef={amountDisplayRef}
            onSubmit={onSubmit}
            fee={
                <TransactionFeeFieldIcon
                    amount={form.feeAmount}
                    currencySymbol={form.currencySymbol}
                    instrumentType={form.instrumentType}
                    onPress={form.handleFeePress}
                />
            }
        >
            {(fields, onConfirm) => (
                <QuickFormLayout
                    onDismissKeypad={dismissKeypad}
                    amount={
                        <TransactionAmountDisplay
                            ref={amountDisplayRef}
                            amount={displayAmount}
                            currencySymbol={form.currencySymbol}
                            variant={form.amountVariant}
                            onPress={toggleKeypad}
                            isEditing={isEditingAmount}
                            accessibilityHint={amountAccessibilityHint}
                            testID={SimpleQuickFormSelector.AmountInput}
                        />
                    }
                    context={
                        <MccInfoRow transactionTitle={merchant} mccCategoryId={formState.mccCategoryId} suggestions={suggestions}>
                            {children}
                        </MccInfoRow>
                    }
                    keypad={keypad}
                    actions={
                        <TransactionFormActions
                            label={t`Save`}
                            isDisabled={isConfirmDisabled}
                            onConfirm={onConfirm}
                            testID={SimpleQuickFormSelector.SubmitButton}
                        />
                    }
                >
                    {fields}
                </QuickFormLayout>
            )}
        </SimpleQuickFormControls>
    );
};
