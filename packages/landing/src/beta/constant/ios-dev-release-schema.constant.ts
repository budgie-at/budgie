import * as Schema from 'effect/Schema';

export const IosDevReleaseSchema = Schema.Struct({
    tag_name: Schema.String,
    name: Schema.String,
    body: Schema.String,
    draft: Schema.Boolean,
    created_at: Schema.String,
    published_at: Schema.String,
    assets: Schema.Array(
        Schema.Struct({
            name: Schema.String,
            browser_download_url: Schema.String
        })
    )
});

export type IosDevRelease = typeof IosDevReleaseSchema.Type;
