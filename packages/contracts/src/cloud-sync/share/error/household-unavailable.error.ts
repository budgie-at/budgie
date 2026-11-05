import * as Schema from 'effect/Schema';

export class HouseholdUnavailableError extends Schema.TaggedError<HouseholdUnavailableError>()('HouseholdUnavailableError', {}) {
    override get message(): string {
        return 'No household exists on this device';
    }
}
