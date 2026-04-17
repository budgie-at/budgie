import { AccountEntityInterface } from '../../account/entity/account-entity.interface';
import { TransactionEntityInterface } from '../../transaction/entity/transaction-entity.interface';
import { TransactionEntryWithRelationsEntityInterface } from '../../transaction-entry/entity/transaction-entry-with-relations-entity.interface';
import { TransactionTagsWithTagEntityInterface } from '../../transaction-tags/entity/transaction-tags-with-tag-entity.interface';

export interface PendingEmbeddingRowInterface extends TransactionEntityInterface {
    readonly entries: TransactionEntryWithRelationsEntityInterface[];
    readonly transactionTags: TransactionTagsWithTagEntityInterface[];
    readonly fromAccount: AccountEntityInterface | null;
    readonly toAccount: AccountEntityInterface | null;
}
