import { TransactionCreateInputInterface, TransactionEntryCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { TransactionAccountRowRef } from '../components/transaction-account-row/transaction-account-row';
import { TransactionAmountDisplayRef } from '../components/transaction-amount-display/transaction-amount-display';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';
import { getTransactionFeeEntries } from '../utils/get-transaction-fee-entries.util';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import { useQuickFormValidation } from './use-quick-form-validation.hook';

import type { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';
import type { QuickFormBuildEntryParamsInterface } from '../interface/quick-form-build-entry-params.interface';
import type { TransactionFieldIconsRefInterface } from '../interface/transaction-field-icons-ref.interface';

interface UseQuickFormSubmitConfig {
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly amountDisplayRef: RefObject<TransactionAmountDisplayRef | null>;
    readonly fieldIconsRef: RefObject<TransactionFieldIconsRefInterface | null>;
    readonly accountRowRef: RefObject<TransactionAccountRowRef | null>;
    readonly buildEntries: (params: QuickFormBuildEntryParamsInterface) => TransactionEntryCreateInputInterface[];
    readonly isSplitActive: boolean;
    readonly mccCategoryId: number | null;
    readonly transactionType: TransactionTypeEnum;
    readonly onSubmit: () => void;
}

interface UseQuickFormSubmitResult {
    readonly handleConfirm: () => void;
}

export const useQuickFormSubmit = ({
    accountFieldName,
    amountDisplayRef,
    fieldIconsRef,
    accountRowRef,
    buildEntries,
    isSplitActive,
    mccCategoryId,
    transactionType,
    onSubmit
}: UseQuickFormSubmitConfig): UseQuickFormSubmitResult => {
    const { setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();

    const getAccountId = () => {
        const selectedAccountId = getValues(accountFieldName);

        return isDefined(selectedAccountId) ? selectedAccountId : 0;
    };

    const handleNormalConfirm = () => {
        const amount = getValues('amount');
        const currentEntries = getValues('entries');
        const accountId = getAccountId();
        const categoryEntry = getTransactionCategoryEntries(currentEntries).at(0);
        const feeEntries = getTransactionFeeEntries(currentEntries).map(entry => ({ ...entry, accountId }));
        const feeTotal = sumEntryAmounts(feeEntries);
        const formCategoryId = categoryEntry?.categoryId ?? 0;
        const categoryAmount = transactionType === TransactionTypeEnum.EXPENSE ? amount - feeTotal : amount;

        const isValid = validateAndShake([
            { isValid: isPositiveNumber(amount), shake: () => amountDisplayRef.current?.shake() },
            { isValid: isPositiveNumber(categoryAmount), shake: () => amountDisplayRef.current?.shake() },
            { isValid: isPositiveNumber(formCategoryId), shake: () => fieldIconsRef.current?.shakeCategory() },
            { isValid: isPositiveNumber(accountId), shake: () => accountRowRef.current?.shake() }
        ]);

        if (!isValid) {
            return;
        }

        const builtEntries = buildEntries({ accountId, categoryId: formCategoryId, amount: categoryAmount, mccCategoryId });

        setValue('entries', [...builtEntries, ...feeEntries], { shouldValidate: false });

        onSubmit();
    };

    const handleSplitConfirm = () => {
        const accountId = getAccountId();
        const currentEntries = getValues('entries');
        const categoryEntries = getTransactionCategoryEntries(currentEntries);
        const feeEntries = getTransactionFeeEntries(currentEntries).map(entry => ({ ...entry, accountId }));
        const allEntriesValid = categoryEntries.every(entry => isPositiveNumber(entry.amount) && isPositiveNumber(entry.categoryId));
        const categoryTotalAmount = sumEntryAmounts(categoryEntries);
        const totalAmount =
            transactionType === TransactionTypeEnum.EXPENSE ? categoryTotalAmount + sumEntryAmounts(feeEntries) : categoryTotalAmount;

        const isValid = validateAndShake([
            { isValid: isPositiveNumber(categoryTotalAmount), shake: () => amountDisplayRef.current?.shake() },
            { isValid: allEntriesValid },
            { isValid: isPositiveNumber(accountId), shake: () => accountRowRef.current?.shake() }
        ]);

        if (!isValid) {
            return;
        }

        setValue('entries', [...categoryEntries, ...feeEntries], { shouldValidate: false });
        setValue('amount', totalAmount);

        onSubmit();
    };

    const handleConfirm = isSplitActive ? handleSplitConfirm : handleNormalConfirm;

    return { handleConfirm };
};
