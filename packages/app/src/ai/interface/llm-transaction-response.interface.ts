import { infer as zodInfer } from 'zod';

import { LlmTransactionResponseSchema } from '../schema/llm-transaction-response.schema';

export type LlmTransactionResponseInterface = zodInfer<typeof LlmTransactionResponseSchema>;
