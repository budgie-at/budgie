import * as Schema from 'effect/Schema';

export class SyncUpdateRequiredError extends Schema.TaggedError<SyncUpdateRequiredError, { readonly brand: unique symbol }>()(
    'SyncUpdateRequiredError',
    {
        syncZone: Schema.String,
        requiredSchemaVersion: Schema.Finite
    }
) {
    override get message(): string {
        return `Update Budgie to keep syncing zone ${this.syncZone} (schema version ${this.requiredSchemaVersion})`;
    }
}
