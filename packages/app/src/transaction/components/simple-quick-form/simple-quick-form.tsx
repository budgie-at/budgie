import { TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode, Ref, useImperativeHandle, useRef } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { useQuickFormAmount } from '../../hook/use-quick-form-amount.hook';
import { useQuickFormFee } from '../../hook/use-quick-form-fee.hook';
import { useSimpleQuickFormState } from '../../hook/use-simple-quick-form-state.hook';
import { MccInfoRow } from '../mcc-info-row/mcc-info-row';
import { QuickFormBottom } from '../quick-form-bottom/quick-form-bottom';
import { QuickFormLayout } from '../quick-form-layout/quick-form-layout';
import { QuickFormSecondaryLine } from '../quick-form-secondary-line/quick-form-secondary-line';
import { QuickFormValidationSlot } from '../quick-form-validation-slot/quick-form-validation-slot';
import { SimpleQuickFormControls } from '../simple-quick-form-controls/simple-quick-form-controls';
import { SuggestionsContainer } from '../suggestions-container/suggestions-container';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';

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

export const SimpleQuickForm = ({
    ref,
    transactionType,
    aiContext = '',
    isNewTransaction = false,
    children,
    onSubmit,
    onCancel
}: Props) => {
    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;
    const variant = isExpense ? 'destructive' : 'positive';
    const accountFieldName = isExpense ? 'fromAccountId' : 'toAccountId';
    const { displayValue, numericValue, currencySymbol, instrumentType, keypadHandlers, setFromNumeric } = useQuickFormAmount({
        accountFieldName
    });
    const formState = useSimpleQuickFormState({ accountFieldName, setFromNumeric });
    const { feeAmount, handleFeePress } = useQuickFormFee({
        accountFieldName,
        currencySymbol,
        entries: formState.entries,
        transactionType,
        variant,
        setFromNumeric
    });
    const amountDisplayRef = useRef<TransactionAmountDisplayRef>(null);
    const amountVariant = !isExpense && isPositiveNumber(numericValue) ? 'positive' : 'primary';

    useImperativeHandle(ref, () => ({ openFee: handleFeePress }));

    return (
        <QuickFormLayout>
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

            <QuickFormBottom>
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

                <SimpleQuickFormControls
                    transactionType={transactionType}
                    currencySymbol={currencySymbol}
                    keypadHandlers={keypadHandlers}
                    setFromNumeric={setFromNumeric}
                    formState={formState}
                    amountDisplayRef={amountDisplayRef}
                    onSubmit={onSubmit}
                    onCancel={onCancel}
                />
            </QuickFormBottom>
        </QuickFormLayout>
    );
};
