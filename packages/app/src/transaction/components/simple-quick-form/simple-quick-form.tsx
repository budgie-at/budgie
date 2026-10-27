import { TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode, Ref, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';

import { SimpleQuickFormContext } from '../../context/simple-quick-form.context';
import { useQuickFormAmount } from '../../hook/use-quick-form-amount.hook';
import { useQuickFormFee } from '../../hook/use-quick-form-fee.hook';
import { useSimpleQuickFormState } from '../../hook/use-simple-quick-form-state.hook';
import { QuickFormBottomOverlay } from '../quick-form-bottom-overlay/quick-form-bottom-overlay';
import { SimpleQuickFormAmountBottomContent } from '../simple-quick-form-amount-bottom-content/simple-quick-form-amount-bottom-content';
import { SimpleQuickFormAmountHeader } from '../simple-quick-form-amount-header/simple-quick-form-amount-header';
import { SimpleQuickFormControls } from '../simple-quick-form-controls/simple-quick-form-controls';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';

import { SimpleQuickFormSelector } from './simple-quick-form.selector';

import type { DebtSettlementAccountInterface } from '../../interface/debt-settlement-account.interface';
import type { SimpleQuickFormContextValueInterface } from '../../interface/simple-quick-form-context-value.interface';
import type { SimpleQuickFormRefInterface } from '../../interface/simple-quick-form-ref.interface';

interface Props {
    readonly ref?: Ref<SimpleQuickFormRefInterface>;
    readonly transactionType: TransactionTypeEnum;
    readonly aiContext?: string;
    readonly isNewTransaction?: boolean;
    readonly debtSettlementAccount?: DebtSettlementAccountInterface | null;
    readonly children?: ReactNode;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}

export const SimpleQuickForm = ({
    ref,
    transactionType,
    aiContext = '',
    isNewTransaction = false,
    debtSettlementAccount = null,
    children,
    onSubmit,
    onCancel
}: Props) => {
    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;
    const variant = isExpense ? 'destructive' : 'positive';
    const accountFieldName = isExpense ? 'fromAccountId' : 'toAccountId';
    const { displayValue, currencySymbol, instrumentType, keypadHandlers, setFromNumeric } = useQuickFormAmount({ accountFieldName });
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

    useImperativeHandle(ref, () => ({ openFee: handleFeePress }));

    const contextValue: SimpleQuickFormContextValueInterface = {
        variant,
        transactionType,
        accountFieldName,
        aiContext,
        isNewTransaction,
        currencySymbol,
        keypadHandlers,
        setFromNumeric,
        formState,
        amountDisplayRef,
        onSubmit,
        onCancel
    };

    return (
        <SimpleQuickFormContext.Provider value={contextValue}>
            <View className="flex-1">
                <View className="flex-1">
                    <View className="flex-1">
                        <TransactionAmountDisplay
                            ref={amountDisplayRef}
                            amount={displayValue}
                            currencySymbol={currencySymbol}
                            variant={variant}
                            topContent={<SimpleQuickFormAmountHeader>{children}</SimpleQuickFormAmountHeader>}
                            testID={SimpleQuickFormSelector.AmountInput}
                        >
                            <View className="mt-lg items-center">
                                <SimpleQuickFormAmountBottomContent
                                    debtSettlementAccount={debtSettlementAccount}
                                    feeAmount={feeAmount}
                                    feeCurrencySymbol={currencySymbol}
                                    feeInstrumentType={instrumentType}
                                    showInlineFeeAction={isNewTransaction}
                                    onFeePress={handleFeePress}
                                />
                            </View>
                        </TransactionAmountDisplay>
                    </View>
                    <QuickFormBottomOverlay />
                </View>

                <SimpleQuickFormControls />
            </View>
        </SimpleQuickFormContext.Provider>
    );
};
