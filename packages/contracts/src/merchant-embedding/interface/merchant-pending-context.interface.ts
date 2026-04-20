import { EmbeddingPendingContextBaseInterface } from '../../@generic/interface/embedding-pending-context-base.interface';

export interface MerchantPendingContextInterface extends EmbeddingPendingContextBaseInterface {
    readonly title: string;
    readonly mccDescription: string;
    readonly comment: string;
}
