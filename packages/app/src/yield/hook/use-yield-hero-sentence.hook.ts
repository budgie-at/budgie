import { isDefined } from '@rnw-community/shared';

import { useYieldRangeSentence } from './use-yield-range-sentence.hook';
import { useYieldScrubSentence } from './use-yield-scrub-sentence.hook';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

export const useYieldHeroSentence = (
    summary: YieldSummaryInterface | null,
    rangeCaption: string,
    bucket: YieldBucketInterface | null,
    scrubAmount: number
): string => {
    const rangeSentence = useYieldRangeSentence(summary, rangeCaption);
    const scrubSentence = useYieldScrubSentence(summary, bucket, scrubAmount);

    return isDefined(scrubSentence) ? scrubSentence : rangeSentence;
};
