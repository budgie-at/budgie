import { BudgetAllocationTypeEnum, BudgetRolloverRuleEnum } from '@budgie/contracts';
import { z } from 'zod';

export const AllocationFormSchema = z.object({
    categoryId: z.number().positive().nullable(),
    allocationType: z.nativeEnum(BudgetAllocationTypeEnum),
    amount: z.number().nonnegative().optional().transform(val => val ?? 0),
    percentage: z.number().min(0).max(100).optional().transform(val => val ?? 0),
    rolloverRule: z.nativeEnum(BudgetRolloverRuleEnum),
    rolloverCap: z.number().positive().nullable(),
    isSinkingFund: z.boolean(),
    sinkingFundTarget: z.number().positive().nullable(),
    isExcluded: z.boolean()
});

export type AllocationFormValues = z.infer<typeof AllocationFormSchema>;

