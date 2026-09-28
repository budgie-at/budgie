import type { RulePrefillDataInterface } from '../../rule/interface/rule-prefill-data.interface';
import type { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';
import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxLabelInterface } from './categorize-inbox-label.interface';
import type { TransactionCategorizeInboxRepository, TransactionFilterInterface } from '@budgie/contracts';
import type { UnknownInputParams } from 'expo-router';

export interface CategorizeInboxStrategyInterface {
    readonly labelKind: CategorizeInboxLabelKindEnum;
    readonly labelsById: ReadonlyMap<number, CategorizeInboxLabelInterface>;
    readonly pageTitle: string;
    readonly emptyDescription: string;
    readonly selectLabel: string;
    readonly moreLabels: string;
    readonly pickRowLabel: string;
    readonly writeFailed: string;
    readonly assignAs: (labelTitle: string) => string;
    readonly assignedCount: (count: number) => string;
    readonly doneThisSession: (count: number) => string;
    readonly findRows: (filters: TransactionFilterInterface) => ReturnType<TransactionCategorizeInboxRepository['findUncategorizedRows']>;
    readonly findEvidence: () => ReturnType<TransactionCategorizeInboxRepository['findCategoryEvidence' | 'findTagEvidence']>;
    readonly pickLabels: (description: string, suggestedLabelIds: number[]) => Promise<number[] | null>;
    readonly pickFollowUpTagIds: ((assignment: CategorizeInboxAssignmentInterface) => Promise<number[] | null>) | null;
    readonly buildRuleActions: (labelIds: number[]) => Pick<RulePrefillDataInterface, 'categoryId' | 'tagIds'>;
    readonly buildListRouteParams: (filters: TransactionFilterInterface) => UnknownInputParams;
}
