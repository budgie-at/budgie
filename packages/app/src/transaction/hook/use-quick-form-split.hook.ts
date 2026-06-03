import {
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { useSplitEntriesModal } from '../context/split-entries-modal.context';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';
import { getTransactionFeeEntries } from '../utils/get-transaction-fee-entries.util';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import type { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';

interface UseQuickFormSplitConfig {
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly currencySymbol: string;
    readonly entryType: TransactionEntryTypeEnum;
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly setFromNumeric: (value: number) => void;
}

interface UseQuickFormSplitResult {
    readonly handleSplitIconPress: () => void;
}

export const useQuickFormSplit = ({
    accountFieldName,
    currencySymbol,
    entryType,
    transactionType,
    variant,
    setFromNumeric
}: UseQuickFormSplitConfig): UseQuickFormSplitResult => {
    const { getValues, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openSplitEntries] = useSplitEntriesModal();

    const buildInitialSplitEntries = (
        currentCategoryEntries: TransactionEntryCreateInputInterface[],
        accountId: number
    ): TransactionEntryCreateInputInterface[] => {
        if (currentCategoryEntries.length > 1) {
            return currentCategoryEntries;
        }

        const currentCategoryEntry = currentCategoryEntries.at(0);
        const categoryId = isDefined(currentCategoryEntry) ? currentCategoryEntry.categoryId : 0;

        return [
            {
                accountId,
                categoryId,
                amount: 0,
                type: entryType,
                mccCategoryId: null,
                externalId: null
            }
        ];
    };

    const applySplitResult = (
        result: TransactionEntryCreateInputInterface[],
        currentFeeEntries: TransactionEntryCreateInputInterface[],
        feeTotal: number
    ) => {
        const hasMultipleEntries = result.length > 1;
        const hasSingleEntryWithAmount = result.length === 1 && result[0].amount > 0;

        if (!hasMultipleEntries && !hasSingleEntryWithAmount) {
            return;
        }

        const categoryTotalAmount = sumEntryAmounts(result);
        const totalAmount = transactionType === TransactionTypeEnum.EXPENSE ? categoryTotalAmount + feeTotal : categoryTotalAmount;

        setValue('entries', [...result, ...currentFeeEntries], { shouldValidate: false });
        setValue('amount', totalAmount);
        setFromNumeric(totalAmount);
    };

    const handleSplitPress = async () => {
        const currentEntries = getValues('entries');
        const currentCategoryEntries = getTransactionCategoryEntries(currentEntries);
        const currentFeeEntries = getTransactionFeeEntries(currentEntries);
        const feeTotal = sumEntryAmounts(currentFeeEntries);
        const currentAmount = getValues('amount');
        const selectedAccountId = getValues(accountFieldName);
        const accountId = isDefined(selectedAccountId) ? selectedAccountId : 0;
        const splitAmount = transactionType === TransactionTypeEnum.EXPENSE ? Math.max(currentAmount - feeTotal, 0) : currentAmount;
        const result = await openSplitEntries({
            entries: buildInitialSplitEntries(currentCategoryEntries, accountId),
            variant,
            entryType,
            currencySymbol,
            totalAmount: splitAmount
        });

        if (isDefined(result)) {
            applySplitResult(result, currentFeeEntries, feeTotal);
        }
    };

    const handleSplitIconPress = () => void handleSplitPress();

    return { handleSplitIconPress };
};
