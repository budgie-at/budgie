import { AITransactionInterface } from '@budgie/ai';
import { useEffect, useEffectEvent } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { VoiceReviewModalContent } from '../ai/component/voice-review-modal-content/voice-review-modal-content';
import { useVoiceReviewModal, useVoiceReviewModalParams } from '../ai/context/voice-review-modal.context';
import { VoiceReviewRowInterface } from '../ai/interface/voice-review-row.interface';

import type { VoiceReviewModalResult } from '../ai/context/voice-review-modal.context';

const mapExtractedToReviewRows = (transactions: AITransactionInterface[]): VoiceReviewRowInterface[] => {
    const usedCategoryIds = new Set<number>();

    return transactions.map((transaction, index) => {
        const suggestedCategoryId = transaction.category?.id ?? null;
        const categoryId = isPositiveNumber(suggestedCategoryId) && !usedCategoryIds.has(suggestedCategoryId) ? suggestedCategoryId : null;

        if (isPositiveNumber(categoryId)) {
            usedCategoryIds.add(categoryId);
        }

        return {
            id: `voice-row-${Date.now()}-${index}`,
            amount: transaction.amount,
            currency: transaction.currency,
            description: transaction.comment,
            accountId: transaction.account?.id ?? null,
            categoryId
        };
    });
};

export default function VoiceReviewModal() {
    const [, resolveVoiceReview, dismissVoiceReview] = useVoiceReviewModal();
    useModalDismiss(dismissVoiceReview);
    const currentParams = useVoiceReviewModalParams();
    const { handleCommit, handleDismissed } = useMorphingSheetResult<VoiceReviewModalResult>(resolveVoiceReview);

    const handleUnmount = useEffectEvent(() => void resolveVoiceReview({ kind: 're-record' }, { skipBack: true }));

    useEffect(() => () => void handleUnmount(), []);

    if (!isDefined(currentParams)) {
        return null;
    }

    return (
        <VoiceReviewModalContent
            initialRows={mapExtractedToReviewRows(currentParams.transactions)}
            originalText={currentParams.originalText}
            onCommit={handleCommit}
            onDismiss={handleDismissed}
        />
    );
}
