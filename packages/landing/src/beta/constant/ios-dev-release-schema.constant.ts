import { z } from 'zod';

export const IosDevReleaseSchema = z.object({
    name: z.string(),
    body: z.string(),
    published_at: z.string(),
    assets: z.array(z.object({ name: z.string() }))
});

export type IosDevRelease = z.infer<typeof IosDevReleaseSchema>;
