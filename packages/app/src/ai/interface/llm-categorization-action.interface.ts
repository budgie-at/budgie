import { LlmCategorizationActionTypeEnum } from '../enum/llm-categorization-action-type.enum';

import type { AITransactionInterface } from '@budgie/ai';

export type LlmCategorizationActionInterface =
    | { readonly type: LlmCategorizationActionTypeEnum.CATEGORIZATION_STARTED }
    | { readonly type: LlmCategorizationActionTypeEnum.CATEGORIZATION_SUCCEEDED; readonly transactions: AITransactionInterface[] }
    | { readonly type: LlmCategorizationActionTypeEnum.CATEGORIZATION_FAILED; readonly error: string }
    | { readonly type: LlmCategorizationActionTypeEnum.RESET };
