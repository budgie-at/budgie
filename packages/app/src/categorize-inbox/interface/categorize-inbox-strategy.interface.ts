import type { RulePrefillDataInterface } from '../../rule/interface/rule-prefill-data.interface';
import type { CategorizeInboxEvidenceQueryType } from '../type/categorize-inbox-evidence-query.type';
import type { CategorizeInboxRowsQueryType } from '../type/categorize-inbox-rows-query.type';
import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxCopyInterface } from './categorize-inbox-copy.interface';
import type { CategorizeInboxFollowUpInterface } from './categorize-inbox-follow-up.interface';
import type { CategorizeInboxLabelInterface } from './categorize-inbox-label.interface';
import type { TransactionFilterInterface } from '@budgie/contracts';
import type { UnknownInputParams } from 'expo-router';

export interface CategorizeInboxStrategyInterface {
    readonly labelsById: ReadonlyMap<number, CategorizeInboxLabelInterface>;
    readonly copy: CategorizeInboxCopyInterface;
    readonly followUp: CategorizeInboxFollowUpInterface | null;
    readonly findRows: (filters: TransactionFilterInterface) => CategorizeInboxRowsQueryType;
    readonly findEvidence: () => CategorizeInboxEvidenceQueryType;
    readonly assignMany: (assignments: CategorizeInboxAssignmentInterface[]) => Promise<CategorizeInboxAssignmentInterface[]>;
    readonly undo: (assignments: CategorizeInboxAssignmentInterface[]) => Promise<void>;
    readonly pickLabels: (description: string, suggestedLabelIds: number[]) => Promise<number[] | null>;
    readonly buildRuleActions: (labelIds: number[]) => Pick<RulePrefillDataInterface, 'categoryId' | 'tagIds'>;
    readonly buildListRouteParams: (filters: TransactionFilterInterface) => UnknownInputParams;
}
