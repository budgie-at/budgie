import * as Schema from 'effect/Schema';

export class InzhurPriceParseError extends Schema.TaggedError<InzhurPriceParseError>()('InzhurPriceParseError', {
    reason: Schema.String
}) {
    override get message(): string {
        return `Inzhur price page could not be parsed: ${this.reason}`;
    }
}
