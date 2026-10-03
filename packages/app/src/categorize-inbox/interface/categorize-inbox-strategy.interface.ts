import type { RulePrefillDataInterface } from '../../rule/interface/rule-prefill-data.interface';
import type { categoryEvidenceAtom, uncategorizedRowsAtom } from '../constant/categorize-inbox-atoms.constant';
import type { CategorizeInboxLabelInterface } from './categorize-inbox-label.interface';
import type { CategorizeInboxAssignmentInterface, CategorizeInboxLabelKindEnum } from '@budgie/categorization';
import type { TransactionFilterInterface } from '@budgie/contracts';
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
    readonly rowsAtom: typeof uncategorizedRowsAtom;
    readonly evidenceAtom: typeof categoryEvidenceAtom;
    readonly pickLabels: (description: string, suggestedLabelIds: number[]) => Promise<number[] | null>;
    readonly pickFollowUpTagIds: ((assignment: CategorizeInboxAssignmentInterface) => Promise<number[] | null>) | null;
    readonly buildRuleActions: (labelIds: number[]) => Pick<RulePrefillDataInterface, 'categoryId' | 'tagIds'>;
    readonly buildListRouteParams: (filters: TransactionFilterInterface) => UnknownInputParams;
}
