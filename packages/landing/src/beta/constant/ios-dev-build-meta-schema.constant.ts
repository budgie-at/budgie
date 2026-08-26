import { z } from 'zod';

// Contract of the build-meta.json asset attached to every release published by
// rnw-community/mobile-ci's native-dev-release.yml. Preferred over parsing the
// release tag or notes, both of which are incidental formatting.
export const IosDevBuildMetaSchema = z.object({
    platform: z.string(),
    version: z.string().optional(),
    buildNumber: z.string(),
    commitSha: z.string(),
    branch: z.string(),
    builtAt: z.string(),
    workflowUrl: z.string(),
    tagName: z.string(),
    assetName: z.string(),
    sha256: z.string()
});

export type IosDevBuildMeta = z.infer<typeof IosDevBuildMetaSchema>;
