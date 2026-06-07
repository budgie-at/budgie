import {
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { useTransactionFeeModal } from '../context/transaction-fee-modal.context';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';
import { getTransactionFeeEntries } from '../utils/get-transaction-fee-entries.util';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import type { TransactionFeeModalResult } from '../context/transaction-fee-modal.context';
import type { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';

interface UseQuickFormFeeConfig {
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly currencySymbol: string;
    readonly entries: readonly TransactionEntryCreateInputInterface[];
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly setFromNumeric: (value: number) => void;
}

interface UseQuickFormFeeResult {
    readonly feeAmount: number;
    readonly handleFeePillPress: () => void;
}

export const useQuickFormFee = ({
    accountFieldName,
    currencySymbol,
    entries,
    transactionType,
    variant,
    setFromNumeric
}: UseQuickFormFeeConfig): UseQuickFormFeeResult => {
    const { getValues, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openTransactionFee] = useTransactionFeeModal();

    const feeEntries = getTransactionFeeEntries(entries);
    const feeAmount = sumEntryAmounts(feeEntries);

    const applyFeeResult = (
        result: TransactionFeeModalResult,
        currentEntries: TransactionEntryCreateInputInterface[],
        currentFeeEntries: TransactionEntryCreateInputInterface[],
        accountId: number
    ) => {
        const categoryEntries = getTransactionCategoryEntries(currentEntries);
        const nextFeeEntries = result.map(entry => ({ ...entry, accountId, type: TransactionEntryTypeEnum.FEE }));
        const previousFeeAmount = sumEntryAmounts(currentFeeEntries);
        const nextFeeAmount = sumEntryAmounts(nextFeeEntries);

        setValue('entries', [...categoryEntries, ...nextFeeEntries], { shouldValidate: false });

        if (transactionType === TransactionTypeEnum.EXPENSE) {
            const nextAmount = Math.max(getValues('amount') - previousFeeAmount + nextFeeAmount, 0);

            setValue('amount', nextAmount);
            setFromNumeric(nextAmount);
        }
    };

    const handleFeePress = async () => {
        const currentEntries = getValues('entries');
        const currentFeeEntries = getTransactionFeeEntries(currentEntries);
        const selectedAccountId = getValues(accountFieldName);
        const accountId = isDefined(selectedAccountId) ? selectedAccountId : 0;
        const currentFeeEntry = currentFeeEntries.at(0);
        const entry = isDefined(currentFeeEntry) ? currentFeeEntry : null;
        const result = await openTransactionFee({
            accountId,
            currencySymbol,
            entry,
            variant
        });

        if (isDefined(result)) {
            applyFeeResult(result, currentEntries, currentFeeEntries, accountId);
        }
    };

    const handleFeePillPress = () => void handleFeePress();

    return { feeAmount, handleFeePillPress };
};
