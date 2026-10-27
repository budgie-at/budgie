import { VoiceReviewCreateResultInterface } from './voice-review-create-result.interface';
import { VoiceReviewRowInterface } from './voice-review-row.interface';

import type { AppServices } from '../../@generic/runtime/app.runtime';
import type * as Effect from 'effect/Effect';

export interface UseVoiceReviewReturnInterface {
    readonly rows: VoiceReviewRowInterface[];
    readonly isSaving: boolean;
    readonly canSave: boolean;
    readonly hasInvalidAmounts: boolean;
    readonly hasMissingCategories: boolean;
    readonly editAmount: (id: string, amount: number) => void;
    readonly setCategory: (id: string, categoryId: number) => void;
    readonly deleteRow: (id: string) => void;
    readonly saveAll: (accountId: number) => Effect.Effect<VoiceReviewCreateResultInterface | null, never, AppServices>;
}
