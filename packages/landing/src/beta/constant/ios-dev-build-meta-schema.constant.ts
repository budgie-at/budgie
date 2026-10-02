import * as Schema from 'effect/Schema';

// Contract of the build-meta.json asset attached to every release published by
// rnw-community/mobile-ci's native-dev-release.yml. Preferred over parsing the
// release tag or notes, both of which are incidental formatting.
export const IosDevBuildMetaSchema = Schema.Struct({
    platform: Schema.String,
    version: Schema.optional(Schema.String),
    buildNumber: Schema.String,
    commitSha: Schema.String,
    branch: Schema.String,
    builtAt: Schema.String,
    workflowUrl: Schema.String,
    tagName: Schema.String,
    assetName: Schema.String,
    sha256: Schema.String
});

export type IosDevBuildMeta = typeof IosDevBuildMetaSchema.Type;
