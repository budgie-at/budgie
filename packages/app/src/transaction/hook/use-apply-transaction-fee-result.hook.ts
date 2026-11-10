import { TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries, getTransactionFeeEntries } from '@budgie/ledger';
import { useFormContext } from 'react-hook-form';

import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';
import { sumTransactionAmounts } from '../utils/sum-transaction-amounts.util';

import type { ModalResult } from '../../@generic/type/modal-result.type';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const useApplyTransactionFeeResult = (transactionType: TransactionTypeEnum, setFromNumeric?: (value: number) => void) => {
    const { getValues, setValue } = useFormContext<TransactionCreateInputInterface>();

    return (result: ModalResult<'/transaction-fee'>, accountId: number) => {
        const currentEntries = getValues('entries');
        const categoryEntries = getTransactionCategoryEntries(currentEntries);
        const nextFeeEntries = result.map(entry => ({ ...entry, accountId, type: TransactionEntryTypeEnum.FEE }));
        const previousFeeAmount = sumEntryAmounts(getTransactionFeeEntries(currentEntries));
        const nextFeeAmount = sumEntryAmounts(nextFeeEntries);

        setValue('entries', [...categoryEntries, ...nextFeeEntries], {
            shouldDirty: true,
            shouldValidate: false
        });

        if (transactionType === TransactionTypeEnum.EXPENSE) {
            const nextAmount = Math.max(sumTransactionAmounts(getValues('amount'), -previousFeeAmount, nextFeeAmount), 0);

            setValue('amount', nextAmount, { shouldDirty: true });
            setFromNumeric?.(nextAmount);
        }
    };
};
