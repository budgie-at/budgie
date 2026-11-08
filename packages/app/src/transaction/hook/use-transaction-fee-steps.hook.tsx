import { BANK_FEE_CATEGORY_ID, CategorySourceEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { MorphingSheetPresentationEnum } from '../../@generic/enum/morphing-sheet-presentation.enum';
import { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';
import { TransactionFeeStep } from '../components/transaction-fee-step/transaction-fee-step';

import { useTransactionCategorySteps } from './use-transaction-category-steps.hook';
import { useTransactionFeeAmountFocus } from './use-transaction-fee-amount-focus.hook';

import type { TransactionFeeStepsConfigInterface } from '../interface/transaction-fee-steps-config.interface';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

const createFeeEntry = (entry: TransactionEntryCreateInputInterface | null, accountId: number): TransactionEntryCreateInputInterface =>
    entry ?? {
        accountId,
        categoryId: BANK_FEE_CATEGORY_ID,
        categorySource: CategorySourceEnum.FEE,
        amount: 0,
        type: TransactionEntryTypeEnum.FEE,
        mccCategoryId: null,
        externalId: null
    };

export const useTransactionFeeSteps = (config: TransactionFeeStepsConfigInterface) => {
    const { accountId, currencySymbol, entry, variant, isFeeActive, onConfirm, onShowFee, onShowCategory, onShowCreate, onDone } = config;
    const [feeEntry, setFeeEntry] = useState(() => createFeeEntry(entry, accountId));
    const { account } = useGetAccountByIdQuery(accountId);
    const isExisting = isDefined(entry);
    const { amountRef, markReturning } = useTransactionFeeAmountFocus(isFeeActive, !isExisting);

    const handleAmountChange = (amount: number) => {
        setFeeEntry(previous => ({ ...previous, amount }));
    };

    const handleOpenFee = () => {
        setFeeEntry(createFeeEntry(entry, accountId));
        onShowFee();
    };

    const handleReturnToFee = () => {
        markReturning();
        onShowFee();
    };

    const handleCategorySelect = (selectedCategoryId: number) => {
        const categorySource = selectedCategoryId === BANK_FEE_CATEGORY_ID ? CategorySourceEnum.FEE : CategorySourceEnum.USER;

        setFeeEntry(previous => ({ ...previous, categoryId: selectedCategoryId, categorySource }));
        handleReturnToFee();
    };

    const categorySteps = useTransactionCategorySteps({
        variant,
        initialCategoryId: feeEntry.categoryId,
        ...(isDefined(account) && { syncZone: account.syncZone }),
        onSelect: handleCategorySelect,
        onBack: handleReturnToFee,
        onShowCategory,
        onShowCreate
    });

    const steps = {
        ...categorySteps,
        fee: {
            presentation: MorphingSheetPresentationEnum.CARD,
            ...(isDefined(onDone) && { onBack: onDone }),
            content: (
                <TransactionFeeStep
                    feeEntry={feeEntry}
                    currencySymbol={currencySymbol}
                    isExisting={isExisting}
                    amountRef={amountRef}
                    onAmountChange={handleAmountChange}
                    onCategoryPress={onShowCategory}
                    onConfirm={onConfirm}
                    onDone={onDone}
                />
            )
        }
    };

    return { steps, handleOpenFee };
};
