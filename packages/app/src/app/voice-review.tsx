import { AITransactionInterface } from '@budgie/ai';
import { useEffect, useEffectEvent } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { useModalRoute } from '../@generic/hook/use-modal-route/use-modal-route.hook';
import { useMorphingSheetResult } from '../@generic/hook/use-morphing-sheet-result.hook';
import { VoiceReviewModalContent } from '../ai/component/voice-review-modal-content/voice-review-modal-content';
import { VoiceReviewRowInterface } from '../ai/interface/voice-review-row.interface';

import type { ModalResult } from '../@generic/type/modal-result.type';

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
    const { params: currentParams, resolve: resolveVoiceReview } = useModalRoute('/voice-review');
    const { handleCommit, handleDismissed } = useMorphingSheetResult<ModalResult<'/voice-review'>>(resolveVoiceReview);

    const handleUnmount = useEffectEvent(() => void resolveVoiceReview({ kind: 're-record' }, true));

    useEffect(() => () => void handleUnmount(), []);

    const initialRows = mapExtractedToReviewRows(currentParams?.transactions ?? []);
    const originalText = currentParams?.originalText ?? '';

    return (
        <VoiceReviewModalContent
            initialRows={initialRows}
            originalText={originalText}
            onCommit={handleCommit}
            onDismiss={handleDismissed}
        />
    );
}
