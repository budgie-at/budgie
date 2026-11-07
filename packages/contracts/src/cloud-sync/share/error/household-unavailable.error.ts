import * as Schema from 'effect/Schema';

export class HouseholdUnavailableError extends Schema.TaggedError<HouseholdUnavailableError, { readonly brand: unique symbol }>()(
    'HouseholdUnavailableError',
    {}
) {
    override get message(): string {
        return 'No household exists on this device';
    }
}
