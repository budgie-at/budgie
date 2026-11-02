import { TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode, Ref } from 'react';

import { useSimpleQuickForm } from '../../hook/use-simple-quick-form.hook';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { QuickFormLayout } from '../quick-form-layout/quick-form-layout';
import { QuickFormSecondaryLine } from '../quick-form-secondary-line/quick-form-secondary-line';
import { QuickFormValidationSlot } from '../quick-form-validation-slot/quick-form-validation-slot';
import { SimpleQuickFormControls } from '../simple-quick-form-controls/simple-quick-form-controls';
import { SuggestionsContainer } from '../suggestions-container/suggestions-container';
import { TransactionAmountDisplay } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';
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
    const {
        displayValue,
        currencySymbol,
        instrumentType,
        keypadHandlers,
        setFromNumeric,
        formState,
        feeAmount,
        handleFeePress,
        amountDisplayRef,
        amountVariant
    } = useSimpleQuickForm(transactionType, ref);

    return (
        <SimpleQuickFormControls
            transactionType={transactionType}
            currencySymbol={currencySymbol}
            setFromNumeric={setFromNumeric}
            formState={formState}
            amountDisplayRef={amountDisplayRef}
            onSubmit={onSubmit}
        >
            {(fields, onConfirm) => (
                <QuickFormLayout
                    hero={
                        <TransactionAmountDisplay
                            ref={amountDisplayRef}
                            amount={displayValue}
                            currencySymbol={currencySymbol}
                            variant={amountVariant}
                            topContent={children}
                            testID={SimpleQuickFormSelector.AmountInput}
                        >
                            <QuickFormSecondaryLine>
                                <MccInfoRow transactionTitle={formState.title} mccCategoryId={formState.mccCategoryId} />
                            </QuickFormSecondaryLine>
                            <QuickFormValidationSlot>
                                <TransactionFeePill
                                    amount={feeAmount}
                                    currencySymbol={currencySymbol}
                                    instrumentType={instrumentType}
                                    showEmptyState={isNewTransaction}
                                    onPress={handleFeePress}
                                />
                            </QuickFormValidationSlot>
                        </TransactionAmountDisplay>
                    }
                    footer={
                        <TransactionKeypad
                            keypad={keypadHandlers}
                            onConfirm={onConfirm}
                            onCancel={onCancel}
                            confirmTestID={SimpleQuickFormSelector.SubmitButton}
                        />
                    }
                >
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
                    {fields}
                </QuickFormLayout>
            )}
        </SimpleQuickFormControls>
    );
};
