import { CategorizeInboxRowInterface, TransactionTypeEnum } from '@budgie/contracts';

import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';
import { CategorizeInboxTransferKindEnum } from '../enum/categorize-inbox-transfer-kind.enum';

import { CategorizeInboxCandidateInterface } from './categorize-inbox-candidate.interface';

export interface CategorizeInboxClusterInterface {
    readonly key: string;
    readonly type: TransactionTypeEnum;
    readonly displayTitle: string;
    readonly variantCount: number;
    readonly rows: CategorizeInboxRowInterface[];
    readonly totalBaseAmount: number | null;
    readonly sourceAccountId: number;
    readonly candidates: CategorizeInboxCandidateInterface[];
    readonly isConfident: boolean;
    readonly hasEvidence: boolean;
    readonly transferKind: CategorizeInboxTransferKindEnum | null;
    readonly ruleConditionValue: string;
    readonly section: CategorizeInboxSectionEnum;
}
