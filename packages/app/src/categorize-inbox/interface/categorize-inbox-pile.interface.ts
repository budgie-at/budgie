import type { CategorizeInboxPileSegmentInterface } from './categorize-inbox-pile-segment.interface';
import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

export interface CategorizeInboxPileInterface {
    readonly segments: CategorizeInboxPileSegmentInterface[];
    readonly readyCount: number;
    readonly largestReview: CategorizeInboxClusterInterface | null;
}
