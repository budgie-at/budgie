import { i18n } from '@lingui/core';
import * as Schema from 'effect/Schema';

export class DepositCloseAmountInvalidError extends Schema.TaggedError<DepositCloseAmountInvalidError, { readonly brand: unique symbol }>()(
    'DepositCloseAmountInvalidError',
    {}
) {
    override get message(): string {
        return i18n._({ id: 'account.depositCloseAmountInvalid', message: 'Amount received cannot be negative' });
    }
}
