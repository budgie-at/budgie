import { useAtomValue } from '@effect/atom-react/Hooks';
import { useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { MorphingSheetPresentationEnum } from '../../../@generic/enum/morphing-sheet-presentation.enum';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { defaultAccountAtom } from '../../../settings/constants/settings-atoms.constant';
import { useTransactionCategorySteps } from '../../../transaction/hook/use-transaction-category-steps.hook';
import { VoiceReviewStepEnum } from '../../enum/voice-review-step.enum';
import { useVoiceReview } from '../../hook/use-voice-review.hook';
import { VoiceReviewStep } from '../voice-review-step/voice-review-step';

import type { VoiceReviewModalResult } from '../../context/voice-review-modal.context';
import type { VoiceReviewRowInterface } from '../../interface/voice-review-row.interface';

interface Props {
    readonly initialRows: VoiceReviewRowInterface[];
    readonly originalText: string;
    readonly onCommit: (result: VoiceReviewModalResult) => void;
    readonly onDismiss: () => void;
}

// eslint-disable-next-line max-statements -- Content orchestrating the morphing sheet steps and live review rows
export const VoiceReviewModalContent = (props: Props) => {
    const { initialRows, originalText, onCommit, onDismiss } = props;
    const defaultAccount = useAtomValue(defaultAccountAtom);
    const [step, setStep] = useState(VoiceReviewStepEnum.REVIEW);
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const review = useVoiceReview(initialRows);
    const { rows, setCategory } = review;

    const accountId = defaultAccount?.id ?? null;
    const { account: accountWithInstrument } = useGetAccountByIdQuery(accountId ?? 0);
    const currencySymbol = accountWithInstrument?.instrument.symbol ?? '';

    const handleShowReview = () => {
        setStep(VoiceReviewStepEnum.REVIEW);
    };
    const handleShowCategory = () => {
        setStep(VoiceReviewStepEnum.CATEGORY);
    };
    const handleShowCreate = () => {
        setStep(VoiceReviewStepEnum.CREATE_CATEGORY);
    };

    const handleCategoryPress = (rowId: string) => {
        setEditingRowId(rowId);
        handleShowCategory();
    };

    const handleCategorySelect = (selectedCategoryId: number) => {
        if (isDefined(editingRowId)) {
            setCategory(editingRowId, selectedCategoryId);
        }
        handleShowReview();
    };

    const editingRow = rows.find(row => row.id === editingRowId);
    const categorySteps = useTransactionCategorySteps({
        variant: 'destructive',
        initialCategoryId: editingRow?.categoryId ?? null,
        excludeCategoryIds: rows
            .filter(row => row.id !== editingRowId)
            .map(row => row.categoryId)
            .filter(isPositiveNumber),
        ...(isDefined(accountWithInstrument) && { syncZone: accountWithInstrument.syncZone }),
        onSelect: handleCategorySelect,
        onBack: handleShowReview,
        onShowCategory: handleShowCategory,
        onShowCreate: handleShowCreate
    });

    const isReviewStep = step === VoiceReviewStepEnum.REVIEW;
    const steps = {
        [VoiceReviewStepEnum.REVIEW]: {
            presentation: MorphingSheetPresentationEnum.CARD,
            content: (
                <VoiceReviewStep
                    review={review}
                    currencySymbol={currencySymbol}
                    originalText={originalText}
                    accountId={accountId}
                    onCategoryPress={handleCategoryPress}
                    onCommit={onCommit}
                />
            )
        },
        [VoiceReviewStepEnum.CATEGORY]: categorySteps.category,
        [VoiceReviewStepEnum.CREATE_CATEGORY]: categorySteps.createCategory
    };

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} isContentDraggable={isReviewStep} />;
};
