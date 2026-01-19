import type { BudgetTemplateCreateInputSchema } from '../schema/budget-template-create-input.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetTemplateCreateInputInterface extends zodInfer<typeof BudgetTemplateCreateInputSchema> {}
