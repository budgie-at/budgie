import { EmbeddingPendingContextBaseInterface } from '../../@generic/interface/embedding-pending-context-base.interface';

export interface CommentPendingContextInterface extends EmbeddingPendingContextBaseInterface {
    readonly comment: string;
}
