import { z } from 'zod';

export const IosDevReleaseSchema = z.object({
    tag_name: z.string(),
    name: z.string(),
    body: z.string(),
    draft: z.boolean(),
    created_at: z.string(),
    published_at: z.string(),
    assets: z.array(
        z.object({
            name: z.string(),
            browser_download_url: z.string()
        })
    )
});

export type IosDevRelease = z.infer<typeof IosDevReleaseSchema>;
