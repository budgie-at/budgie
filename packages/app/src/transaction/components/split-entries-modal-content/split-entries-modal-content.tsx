import { CategorySourceEnum, TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { SplitEntriesStepEnum } from '../../enum/split-entries-step.enum';
import { useTransactionCategorySteps } from '../../hook/use-transaction-category-steps.hook';
import { EntryWithLocalIdInterface, addLocalId } from '../../utils/entry-with-local-id.util';
import { SplitEntriesStep } from '../split-entries-step/split-entries-step';

interface Props {
    readonly initialEntries: TransactionEntryCreateInputInterface[];
    readonly variant: ColorPaletteVariant;
    readonly entryType: TransactionEntryTypeEnum;
    readonly currencySymbol: string;
    readonly totalAmount: number;
    readonly onConfirm: (entries: TransactionEntryCreateInputInterface[]) => void;
    readonly onDismiss: () => void;
}

export const SplitEntriesModalContent = (props: Props) => {
    const { initialEntries, variant, entryType, currencySymbol, totalAmount, onConfirm, onDismiss } = props;
    const [step, setStep] = useState(SplitEntriesStepEnum.SPLIT);
    const [entries, setEntries] = useState<EntryWithLocalIdInterface[]>(() => initialEntries.map(addLocalId));
    const [editingIndex, setEditingIndex] = useState(0);

    const handleShowSplit = () => {
        setStep(SplitEntriesStepEnum.SPLIT);
    };

    const handleShowCategory = () => {
        setStep(SplitEntriesStepEnum.CATEGORY);
    };

    const handleShowCreate = () => {
        setStep(SplitEntriesStepEnum.CREATE_CATEGORY);
    };

    const handleCategoryPress = (index: number) => {
        setEditingIndex(index);
        handleShowCategory();
    };

    const handleCategorySelect = (selectedCategoryId: number) => {
        setEntries(previous =>
            previous.map((entry, entryIndex) =>
                entryIndex === editingIndex ? { ...entry, categoryId: selectedCategoryId, categorySource: CategorySourceEnum.USER } : entry
            )
        );
        handleShowSplit();
    };

    const isInitiallySplit = initialEntries.length > 1;
    const isSplitStep = step === SplitEntriesStepEnum.SPLIT;

    const categorySteps = useTransactionCategorySteps({
        variant,
        initialCategoryId: entries[editingIndex]?.categoryId ?? null,
        excludeCategoryIds: entries
            .filter((_, entryIndex) => entryIndex !== editingIndex)
            .map(entry => entry.categoryId)
            .filter(isPositiveNumber),
        onSelect: handleCategorySelect,
        onBack: handleShowSplit,
        onShowCategory: handleShowCategory,
        onShowCreate: handleShowCreate
    });

    const steps = {
        [SplitEntriesStepEnum.SPLIT]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <SplitEntriesStep
                    entries={entries}
                    isInitiallySplit={isInitiallySplit}
                    entryType={entryType}
                    currencySymbol={currencySymbol}
                    totalAmount={totalAmount}
                    onEntriesChange={setEntries}
                    onCategoryPress={handleCategoryPress}
                    onConfirm={onConfirm}
                />
            )
        },
        [SplitEntriesStepEnum.CATEGORY]: categorySteps.category,
        [SplitEntriesStepEnum.CREATE_CATEGORY]: categorySteps.createCategory
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} isContentDraggable={isSplitStep} />;
};
