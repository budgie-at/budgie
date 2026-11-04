import type { CategorizeInboxGroupChoiceType } from './categorize-inbox-group-choice.type';
import type { CategorizeInboxLabelInterface } from './categorize-inbox-label.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

export interface CategorizeInboxGroupOptionsInterface {
    readonly learnedAccount: Pick<AccountEntityInterface, 'id' | 'title'> | null;
    readonly matchedAccount: Pick<AccountEntityInterface, 'id' | 'title'> | null;
    readonly isLeadTransfer: boolean;
    readonly isCash: boolean;
    readonly bestMatchLabel: CategorizeInboxLabelInterface | null;
    readonly otherLabels: CategorizeInboxLabelInterface[];
    readonly cashTransactionIds: number[];
    readonly leadChoice: CategorizeInboxGroupChoiceType | null;
}
