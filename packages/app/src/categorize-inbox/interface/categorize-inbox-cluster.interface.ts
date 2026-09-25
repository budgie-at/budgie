import { CategorizeInboxRowInterface, TransactionTypeEnum } from '@budgie/contracts';

import { CategorizeInboxClusterKindEnum } from '../enum/categorize-inbox-cluster-kind.enum';
import { CategorizeInboxConfidenceEnum } from '../enum/categorize-inbox-confidence.enum';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';
import { CategorizeInboxTransferKindEnum } from '../enum/categorize-inbox-transfer-kind.enum';

import { CategorizeInboxCandidateInterface } from './categorize-inbox-candidate.interface';

export interface CategorizeInboxClusterInterface {
    readonly key: string;
    readonly kind: CategorizeInboxClusterKindEnum;
    readonly type: TransactionTypeEnum;
    readonly displayTitle: string;
    readonly variantCount: number;
    readonly rows: CategorizeInboxRowInterface[];
    readonly rowCount: number;
    readonly totalBaseAmount: number | null;
    readonly sourceAccountId: number;
    readonly candidates: CategorizeInboxCandidateInterface[];
    readonly confidence: CategorizeInboxConfidenceEnum;
    readonly topProbability: number;
    readonly transferKind: CategorizeInboxTransferKindEnum | null;
    readonly ruleConditionValue: string;
    readonly section: CategorizeInboxSectionEnum;
}
