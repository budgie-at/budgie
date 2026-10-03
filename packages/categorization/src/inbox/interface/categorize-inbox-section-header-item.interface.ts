import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

export interface CategorizeInboxSectionHeaderItemInterface {
    readonly key: string;
    readonly section: CategorizeInboxSectionEnum;
    readonly count: number;
    readonly totalBaseAmount: number | null;
}
