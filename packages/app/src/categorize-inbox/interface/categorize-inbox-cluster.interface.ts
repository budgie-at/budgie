import { CategorizeInboxRowInterface } from '@budgie/contracts';

import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

export interface CategorizeInboxClusterInterface {
    readonly key: string;
    readonly displayTitle: string;
    readonly rows: CategorizeInboxRowInterface[];
    readonly totalBaseAmount: number | null;
    readonly candidateLabelIds: number[];
    readonly ruleConditionValue: string;
    readonly section: CategorizeInboxSectionEnum;
}
