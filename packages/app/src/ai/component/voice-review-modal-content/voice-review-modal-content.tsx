import { MorphingSheet } from '../../../@generic/component/morphing-sheet/morphing-sheet';
import { useVoiceReviewSteps } from '../../hook/use-voice-review-steps.hook';
import { useVoiceReview } from '../../hook/use-voice-review.hook';

import type { ModalResult } from '../../../@generic/type/modal-result.type';
import type { VoiceReviewRowInterface } from '../../interface/voice-review-row.interface';

interface Props {
    readonly initialRows: VoiceReviewRowInterface[];
    readonly originalText: string;
    readonly onCommit: (result: ModalResult<'/voice-review'>) => void;
    readonly onDismiss: () => void;
}

export const VoiceReviewModalContent = (props: Props) => {
    const { initialRows, originalText, onCommit, onDismiss } = props;
    const review = useVoiceReview(initialRows);
    const { step, steps } = useVoiceReviewSteps({ review, originalText, onCommit });

    return <MorphingSheet steps={steps} activeStep={step} onDismiss={onDismiss} />;
};
