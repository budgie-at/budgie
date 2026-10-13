import * as Schema from 'effect/Schema';

export class AccountNotFoundError extends Schema.TaggedError<AccountNotFoundError>()('AccountNotFoundError', { id: Schema.Number }) {
    override get message(): string {
        return `Account with id ${this.id} not found`;
    }
}
