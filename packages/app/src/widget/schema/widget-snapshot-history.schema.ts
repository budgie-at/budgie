import { z } from 'zod';

export const WidgetSnapshotHistorySchema = z.object({
    generatedAtMs: z.number(),
    netWorth: z.object({ history: z.array(z.number()) }).nullish()
});

export type WidgetSnapshotHistoryType = z.infer<typeof WidgetSnapshotHistorySchema>;
