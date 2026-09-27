import { CategorizeInboxRowInterface } from '@budgie/contracts';

import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

import { CategorizeInboxCandidateInterface } from './categorize-inbox-candidate.interface';

export interface CategorizeInboxClusterInterface {
    readonly key: string;
    readonly displayTitle: string;
    readonly variantCount: number;
    readonly rows: CategorizeInboxRowInterface[];
    readonly totalBaseAmount: number | null;
    readonly candidates: CategorizeInboxCandidateInterface[];
    readonly isConfident: boolean;
    readonly hasEvidence: boolean;
    readonly ruleConditionValue: string;
    readonly section: CategorizeInboxSectionEnum;
}
