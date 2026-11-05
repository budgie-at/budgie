import { TransactionTypeEnum } from '@budgie/contracts';
import { Ref, useImperativeHandle, useRef } from 'react';

import { TransactionAmountDisplayRef } from '../components/transaction-amount-display/transaction-amount-display';

import { useQuickFormAmount } from './use-quick-form-amount.hook';
import { useQuickFormFee } from './use-quick-form-fee.hook';
import { useSimpleQuickFormState } from './use-simple-quick-form-state.hook';

import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { SimpleQuickFormRefInterface } from '../interface/simple-quick-form-ref.interface';

export const useSimpleQuickForm = (transactionType: TransactionTypeEnum, ref?: Ref<SimpleQuickFormRefInterface>) => {
    const isExpense = transactionType === TransactionTypeEnum.EXPENSE;
    const variant = isExpense ? 'destructive' : 'positive';
    const accountFieldName = isExpense ? 'fromAccountId' : 'toAccountId';
    const { displayValue, currencySymbol, instrumentType, keypadHandlers, setFromNumeric } = useQuickFormAmount({
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
    const amountVariant: ColorPaletteVariant = isExpense ? 'primary' : 'positive';

    useImperativeHandle(ref, () => ({ openFee: handleFeePress }));

    return {
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
    };
};
