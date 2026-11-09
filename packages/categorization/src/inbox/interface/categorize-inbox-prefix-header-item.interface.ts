import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

export interface CategorizeInboxPrefixHeaderItemInterface {
    readonly key: string;
    readonly section: CategorizeInboxSectionEnum;
    readonly prefix: string;
    readonly count: number;
}
