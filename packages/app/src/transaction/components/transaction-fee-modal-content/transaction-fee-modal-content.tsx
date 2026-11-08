import { BANK_FEE_CATEGORY_ID, CategorySourceEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { CategoryPickerPanel } from '../../../category/components/category-picker-panel/category-picker-panel';
import { TransactionFeeStepEnum } from '../../enum/transaction-fee-step.enum';
import { TransactionFeeStep } from '../transaction-fee-step/transaction-fee-step';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { TransactionFeeModalResult } from '../../context/transaction-fee-modal.context';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

interface Props {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
    readonly onConfirm: (result: TransactionFeeModalResult) => void;
    readonly onDismiss: () => void;
}

const CATEGORY_STEP_HEIGHT_RATIO = 0.7;
const SHEET_TOP_MARGIN = 24;

export const TransactionFeeModalContent = ({ accountId, currencySymbol, entry, variant, onConfirm, onDismiss }: Props) => {
    const { height: windowHeight } = useWindowDimensions();
    const { top } = useSafeAreaInsets();
    const [step, setStep] = useState(TransactionFeeStepEnum.FEE);
    const [feeEntry, setFeeEntry] = useState<TransactionEntryCreateInputInterface>(
        entry ?? {
            accountId,
            categoryId: BANK_FEE_CATEGORY_ID,
            categorySource: CategorySourceEnum.FEE,
            amount: 0,
            type: TransactionEntryTypeEnum.FEE,
            mccCategoryId: null,
            externalId: null
        }
    );

    const handleAmountChange = (amount: number) => {
        setFeeEntry(previous => ({ ...previous, amount }));
    };

    const handleCategoryPress = () => {
        setStep(TransactionFeeStepEnum.CATEGORY);
    };

    const handleBack = () => {
        setStep(TransactionFeeStepEnum.FEE);
    };

    const handleCategorySelect = (selectedCategoryId: number) => {
        const categorySource = selectedCategoryId === BANK_FEE_CATEGORY_ID ? CategorySourceEnum.FEE : CategorySourceEnum.USER;

        setFeeEntry(previous => ({ ...previous, categoryId: selectedCategoryId, categorySource }));
        setStep(TransactionFeeStepEnum.FEE);
    };

    const isFeeStep = step === TransactionFeeStepEnum.FEE;
    const categoryStepStyle = { height: Math.min(windowHeight * CATEGORY_STEP_HEIGHT_RATIO, windowHeight - top - SHEET_TOP_MARGIN) };

    const steps = {
        [TransactionFeeStepEnum.FEE]: (
            <TransactionFeeStep
                feeEntry={feeEntry}
                currencySymbol={currencySymbol}
                isExisting={isDefined(entry)}
                onAmountChange={handleAmountChange}
                onCategoryPress={handleCategoryPress}
                onConfirm={onConfirm}
            />
        ),
        [TransactionFeeStepEnum.CATEGORY]: (
            <View style={categoryStepStyle}>
                <SheetSurface className="pt-lg">
                    <CategoryPickerPanel
                        variant={variant}
                        initialCategoryId={feeEntry.categoryId}
                        onSelect={handleCategorySelect}
                        onBack={handleBack}
                    />
                </SheetSurface>
            </View>
        )
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} isContentDraggable={isFeeStep} />;
};
