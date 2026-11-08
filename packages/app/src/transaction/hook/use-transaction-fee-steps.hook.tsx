import { BANK_FEE_CATEGORY_ID, CategorySourceEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { SheetSurface } from '../../@generic/component/sheet-surface/sheet-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../@generic/constant/morphing-sheet-height-ratio.constant';
import { MorphingSheetPresentationEnum } from '../../@generic/enum/morphing-sheet-presentation.enum';
import { useMorphingSheetListHeight } from '../../@generic/hook/use-morphing-sheet-list-height.hook';
import { CategoryCreatePage } from '../../category/components/category-create-page/category-create-page';
import { CategoryPickerPanel } from '../../category/components/category-picker-panel/category-picker-panel';
import { TransactionFeeStep } from '../components/transaction-fee-step/transaction-fee-step';

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
    const {
        accountId,
        currencySymbol,
        entry,
        variant,
        isFeeActive,
        shouldFocusOnMount,
        onConfirm,
        onShowFee,
        onShowCategory,
        onShowCreate
    } = config;
    const categoryStepStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const [createTitle, setCreateTitle] = useState('');
    const [feeEntry, setFeeEntry] = useState(() => createFeeEntry(entry, accountId));
    const isExisting = isDefined(entry);
    const { amountRef, markReturning } = useTransactionFeeAmountFocus(isFeeActive, !isExisting && !shouldFocusOnMount);

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

    const handleCreatePress = (defaultTitle: string) => {
        setCreateTitle(defaultTitle);
        onShowCreate();
    };

    const steps = {
        fee: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <TransactionFeeStep
                    feeEntry={feeEntry}
                    currencySymbol={currencySymbol}
                    isExisting={isExisting}
                    shouldAutoFocus={shouldFocusOnMount}
                    amountRef={amountRef}
                    onAmountChange={handleAmountChange}
                    onCategoryPress={onShowCategory}
                    onConfirm={onConfirm}
                />
            )
        },
        category: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <View style={categoryStepStyle}>
                    <SheetSurface className="pt-lg">
                        <CategoryPickerPanel
                            variant={variant}
                            initialCategoryId={feeEntry.categoryId}
                            onSelect={handleCategorySelect}
                            onBack={handleReturnToFee}
                            onCreate={handleCreatePress}
                        />
                    </SheetSurface>
                </View>
            )
        },
        createCategory: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            content: <CategoryCreatePage defaultTitle={createTitle} onSelect={handleCategorySelect} onCancel={onShowCategory} />
        }
    };

    return { steps, handleOpenFee };
};
