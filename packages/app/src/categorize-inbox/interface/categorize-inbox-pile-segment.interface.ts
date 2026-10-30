import type { CategorizeInboxSectionEnum } from '@budgie/categorization';

export interface CategorizeInboxPileSegmentInterface {
    readonly section: CategorizeInboxSectionEnum;
    readonly className: readonly string[];
    readonly count: number;
    readonly share: number;
}
