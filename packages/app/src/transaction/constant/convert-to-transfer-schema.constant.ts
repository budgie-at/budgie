import { z } from 'zod';

export const ConvertToTransferSchema = z.object({
    accountId: z.number().positive()
});

export type ConvertToTransferFormValues = z.infer<typeof ConvertToTransferSchema>;
