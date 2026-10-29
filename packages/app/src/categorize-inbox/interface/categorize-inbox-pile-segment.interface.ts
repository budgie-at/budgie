import type { CategorizeInboxSectionEnum } from '@budgie/categorization';

export interface CategorizeInboxPileSegmentInterface {
    readonly section: CategorizeInboxSectionEnum;
    readonly className: string;
    readonly count: number;
    readonly offset: number;
    readonly share: number;
}
