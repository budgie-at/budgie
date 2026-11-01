import { TransactionCreateInputInterface, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries, getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { TransactionAccountRowRef } from '../components/transaction-account-row/transaction-account-row';
import { TransactionAmountDisplayRef } from '../components/transaction-amount-display/transaction-amount-display';
import { TransactionFieldIconRef } from '../components/transaction-field-icon/transaction-field-icon';
import { buildPrimaryEntry } from '../utils/build-primary-entry.util';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import { useQuickFormValidation } from './use-quick-form-validation.hook';

import type { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';
import type { QuickFormValidationCheckInterface } from '../interface/quick-form-validation-check.interface';

interface UseQuickFormSubmitConfig {
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly amountDisplayRef: RefObject<TransactionAmountDisplayRef | null>;
    readonly categoryIconRef: RefObject<TransactionFieldIconRef | null>;
    readonly accountRowRef: RefObject<TransactionAccountRowRef | null>;
    readonly entryType: TransactionEntryTypeEnum;
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
    categoryIconRef,
    accountRowRef,
    entryType,
    isSplitActive,
    mccCategoryId,
    transactionType,
    onSubmit
}: UseQuickFormSubmitConfig): UseQuickFormSubmitResult => {
    const { t } = useLingui();
    const { setValue, getValues } = useFormContext<TransactionCreateInputInterface>();
    const { validateAndShake } = useQuickFormValidation();

    const getAccountId = () => {
        const selectedAccountId = getValues(accountFieldName);

        return isDefined(selectedAccountId) ? selectedAccountId : 0;
    };

    const buildAmountCheck = (isValid: boolean, message: string): QuickFormValidationCheckInterface => ({
        isValid,
        field: 'amount',
        message,
        shake: () => amountDisplayRef.current?.shake()
    });

    const buildAccountCheck = (accountId: number): QuickFormValidationCheckInterface => ({
        isValid: isPositiveNumber(accountId),
        field: accountFieldName,
        message: t`Choose an account`,
        shake: () => accountRowRef.current?.shake()
    });

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
            buildAmountCheck(isPositiveNumber(amount), t`Enter an amount`),
            buildAmountCheck(isPositiveNumber(categoryAmount), t`Amount must be larger than the fee`),
            {
                isValid: isPositiveNumber(formCategoryId),
                field: 'entries',
                message: t`Choose a category`,
                shake: () => categoryIconRef.current?.shake()
            },
            buildAccountCheck(accountId)
        ]);

        if (!isValid) {
            return;
        }

        const builtEntries = buildPrimaryEntry(entryType, { accountId, categoryId: formCategoryId, amount: categoryAmount, mccCategoryId });

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
            buildAmountCheck(isPositiveNumber(categoryTotalAmount), t`Enter an amount`),
            { isValid: allEntriesValid, field: 'entries', message: t`Complete every split entry` },
            buildAccountCheck(accountId)
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
