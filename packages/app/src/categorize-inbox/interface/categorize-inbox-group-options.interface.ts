import type { CategorizeInboxGroupChoiceType } from './categorize-inbox-group-choice.type';
import type { CategorizeInboxLabelOptionInterface } from './categorize-inbox-label-option.interface';
import type { AccountEntityInterface } from '@budgie/contracts';

export interface CategorizeInboxGroupOptionsInterface {
    readonly learnedAccount: Pick<AccountEntityInterface, 'id' | 'title'> | null;
    readonly isLeadTransfer: boolean;
    readonly isCash: boolean;
    readonly leadLabelOptions: CategorizeInboxLabelOptionInterface[];
    readonly otherLabelOptions: CategorizeInboxLabelOptionInterface[];
    readonly cashTransactionIds: number[];
    readonly leadChoice: CategorizeInboxGroupChoiceType | null;
}
