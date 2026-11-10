import { TransactionCreateInputInterface, TransactionEntryCreateInputInterface, TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';
import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import { useApplyTransactionFeeResult } from './use-apply-transaction-fee-result.hook';

import type { QuickFormAccountFieldName } from '../interface/quick-form-account-field-name.type';

interface UseQuickFormFeeConfig {
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly currencySymbol: string;
    readonly entries: readonly TransactionEntryCreateInputInterface[];
    readonly transactionType: TransactionTypeEnum;
    readonly variant: ColorPaletteVariant;
    readonly setFromNumeric?: (value: number) => void;
}

interface UseQuickFormFeeResult {
    readonly feeAmount: number;
    readonly handleFeePress: () => void;
}

export const useQuickFormFee = ({
    accountFieldName,
    currencySymbol,
    entries,
    transactionType,
    variant,
    setFromNumeric
}: UseQuickFormFeeConfig): UseQuickFormFeeResult => {
    const { getValues } = useFormContext<TransactionCreateInputInterface>();
    const applyFeeResult = useApplyTransactionFeeResult(transactionType, setFromNumeric);
    const openTransactionFee = useOpenModal('/transaction-fee');

    const feeEntries = getTransactionFeeEntries(entries);
    const feeAmount = sumEntryAmounts(feeEntries);

    const handleFeePress = () => {
        const currentEntries = getValues('entries');
        const currentFeeEntries = getTransactionFeeEntries(currentEntries);
        const selectedAccountId = getValues(accountFieldName);
        const accountId = isDefined(selectedAccountId) ? selectedAccountId : 0;
        const currentFeeEntry = currentFeeEntries.at(0);
        const entry = isDefined(currentFeeEntry) ? currentFeeEntry : null;

        openTransactionFee(
            {
                accountId,
                currencySymbol,
                entry,
                variant
            },
            result => {
                if (isDefined(result)) {
                    applyFeeResult(result, accountId);
                }
            }
        );
    };

    return { feeAmount, handleFeePress };
};
