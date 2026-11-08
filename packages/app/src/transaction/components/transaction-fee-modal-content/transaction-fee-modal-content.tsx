import { BANK_FEE_CATEGORY_ID, CategorySourceEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { CategoryCreatePage } from '../../../category/components/category-create-page/category-create-page';
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

export const TransactionFeeModalContent = ({ accountId, currencySymbol, entry, variant, onConfirm, onDismiss }: Props) => {
    const categoryStepStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const [step, setStep] = useState(TransactionFeeStepEnum.FEE);
    const [createTitle, setCreateTitle] = useState('');
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

    const handleCreatePress = (defaultTitle: string) => {
        setCreateTitle(defaultTitle);
        setStep(TransactionFeeStepEnum.CREATE_CATEGORY);
    };

    const handleCreateCancel = () => {
        setStep(TransactionFeeStepEnum.CATEGORY);
    };

    const isFeeStep = step === TransactionFeeStepEnum.FEE;

    const steps = {
        [TransactionFeeStepEnum.FEE]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <TransactionFeeStep
                    feeEntry={feeEntry}
                    currencySymbol={currencySymbol}
                    isExisting={isDefined(entry)}
                    onAmountChange={handleAmountChange}
                    onCategoryPress={handleCategoryPress}
                    onConfirm={onConfirm}
                />
            )
        },
        [TransactionFeeStepEnum.CATEGORY]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <View style={categoryStepStyle}>
                    <SheetSurface className="pt-lg">
                        <CategoryPickerPanel
                            variant={variant}
                            initialCategoryId={feeEntry.categoryId}
                            onSelect={handleCategorySelect}
                            onBack={handleBack}
                            onCreate={handleCreatePress}
                        />
                    </SheetSurface>
                </View>
            )
        },
        [TransactionFeeStepEnum.CREATE_CATEGORY]: {
            presentation: MorphingSheetPresentationEnum.PAGE,
            content: <CategoryCreatePage defaultTitle={createTitle} onSelect={handleCategorySelect} onCancel={handleCreateCancel} />
        }
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} isContentDraggable={isFeeStep} />;
};
