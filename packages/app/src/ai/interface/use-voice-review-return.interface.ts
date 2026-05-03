import { TransactionEntityInterface } from '@budgie/contracts';

import { VoiceReviewRowInterface } from './voice-review-row.interface';

export interface UseVoiceReviewReturnInterface {
    readonly rows: VoiceReviewRowInterface[];
    readonly isSaving: boolean;
    readonly canSave: boolean;
    readonly hasInvalidAmounts: boolean;
    readonly hasMissingCategories: boolean;
    readonly editAmount: (id: string, amount: number) => void;
    readonly setCategory: (id: string, categoryId: number) => void;
    readonly deleteRow: (id: string) => void;
    readonly saveAll: (accountId: number) => Promise<TransactionEntityInterface[] | null>;
}
